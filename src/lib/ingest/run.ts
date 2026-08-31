import type { SupabaseClient } from "@supabase/supabase-js";
import { stablesForChain, type Stable } from "../stables";
import type { Wallet } from "../types";
import type { CursorStore } from "./cursor";
import { fetchEvmBalance, fetchEvmTransfers, type RawTransfer } from "./evm";
import { fetchTronBalance, fetchTronTransfers } from "./tron";

export interface RunSummary {
  wallets: number;
  transfersUpserted: number;
  balancesUpdated: number;
  perWallet: { wallet: string; asset: string; transfers: number; balance: string }[];
  errors: string[];
}

const UNIQUE = "chain,tx_hash,wallet_id,direction,counterparty,amount";

async function fetchTransfers(
  stable: Stable,
  address: string,
  cursor: string | null,
): Promise<{ transfers: RawTransfer[]; nextCursor: string }> {
  if (stable.chain === "tron") {
    const from = cursor ? Number(cursor) : 0;
    const { transfers, lastTimestamp } = await fetchTronTransfers(stable, address, from);
    return { transfers, nextCursor: String(lastTimestamp) };
  }
  // EVM: resume from lastBlock + 1
  const from = cursor ? Number(cursor) + 1 : 0;
  const { transfers, lastBlock } = await fetchEvmTransfers(stable, address, from);
  return { transfers, nextCursor: String(lastBlock) };
}

async function fetchBalance(stable: Stable, address: string): Promise<string> {
  return stable.chain === "tron"
    ? fetchTronBalance(stable, address)
    : fetchEvmBalance(stable, address);
}

/**
 * Index all transfers and refresh balances for the given wallets.
 * - Transfers are upserted idempotently (unique on chain,tx,wallet,dir,cp,amount).
 * - Balances are read directly from the token contract, not summed from transfers.
 */
export interface RunOptions {
  transfers?: boolean; // index transfers (default true)
  balances?: boolean; // refresh balances (default true)
}

export async function runIngest(
  db: SupabaseClient,
  wallets: Wallet[],
  cursors: CursorStore,
  opts: RunOptions = {},
): Promise<RunSummary> {
  const doTransfers = opts.transfers !== false;
  const doBalances = opts.balances !== false;
  const summary: RunSummary = {
    wallets: wallets.length,
    transfersUpserted: 0,
    balancesUpdated: 0,
    perWallet: [],
    errors: [],
  };

  for (const wallet of wallets) {
    for (const stable of stablesForChain(wallet.chain)) {
      try {
        let transfers: RawTransfer[] = [];

        // ── Transfers ─────────────────────────────────────────────────────
        // Native coins (e.g. POL) are balance-only — no transfer index.
        if (doTransfers && !stable.native) {
        const cursor = await cursors.get(wallet.chain, wallet.address, stable.asset);
        const fetched = await fetchTransfers(stable, wallet.address, cursor);
        transfers = fetched.transfers;
        const nextCursor = fetched.nextCursor;

        if (transfers.length > 0) {
          const rows = transfers.map((t) => ({
            wallet_id: wallet.id,
            direction: t.direction,
            counterparty: t.counterparty,
            amount: t.amount,
            asset: stable.asset,
            chain: wallet.chain,
            block_number: t.blockNumber,
            block_time: t.blockTime,
            tx_hash: t.txHash,
          }));

          // Upsert in chunks to keep payloads reasonable.
          for (let i = 0; i < rows.length; i += 500) {
            const chunk = rows.slice(i, i + 500);
            const { error } = await db
              .from("transfers")
              .upsert(chunk, { onConflict: UNIQUE, ignoreDuplicates: true });
            if (error) throw new Error(`upsert transfers: ${error.message}`);
          }
          summary.transfersUpserted += rows.length;
        }

        await cursors.set(wallet.chain, wallet.address, stable.asset, nextCursor);
        }

        // ── Balance (read straight from the contract) ─────────────────────
        let balance = "";
        if (doBalances) {
          balance = await fetchBalance(stable, wallet.address);
          const { error: balErr } = await db.from("balances").upsert(
            {
              wallet_id: wallet.id,
              asset: stable.asset,
              chain: wallet.chain,
              amount: balance,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "wallet_id,asset" },
          );
          if (balErr) throw new Error(`upsert balance: ${balErr.message}`);
          summary.balancesUpdated += 1;
        }

        summary.perWallet.push({
          wallet: wallet.label,
          asset: stable.asset,
          transfers: transfers.length,
          balance,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        summary.errors.push(`${wallet.label}/${stable.asset}: ${msg}`);
      }
    }
  }

  return summary;
}
