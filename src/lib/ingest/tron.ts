import { fromRaw, type Stable } from "../stables";
import type { RawTransfer } from "./evm";

const BASE = "https://api.trongrid.io";
const LIMIT = 200; // TronGrid max page size

interface TronTrc20Tx {
  transaction_id: string;
  block_timestamp: number; // ms
  from: string;
  to: string;
  value: string;
  type?: string;
  token_info?: { address: string; decimals: number };
}

function headers(): HeadersInit {
  const k = process.env.TRONGRID_API_KEY;
  const h: Record<string, string> = { accept: "application/json" };
  if (k) h["TRON-PRO-API-KEY"] = k;
  return h;
}

/**
 * Fetch TRC-20 transfers for `address` on the given stable's contract, starting
 * at `fromTimestampMs` (inclusive). Returns transfers relative to the tracked
 * wallet plus the highest block timestamp (ms) seen for the cursor.
 */
export async function fetchTronTransfers(
  stable: Stable,
  address: string,
  fromTimestampMs: number,
): Promise<{ transfers: RawTransfer[]; lastTimestamp: number }> {
  const out: RawTransfer[] = [];
  let lastTimestamp = fromTimestampMs;
  let fingerprint: string | null = null;

  for (let guard = 0; guard < 1000; guard++) {
    const params = new URLSearchParams({
      contract_address: stable.contract,
      limit: String(LIMIT),
      order_by: "block_timestamp,asc",
      min_timestamp: String(fromTimestampMs),
    });
    if (fingerprint) params.set("fingerprint", fingerprint);

    const url = `${BASE}/v1/accounts/${address}/transactions/trc20?${params.toString()}`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(`TronGrid HTTP ${res.status}`);
    const json = (await res.json()) as {
      data?: TronTrc20Tx[];
      meta?: { fingerprint?: string };
    };

    const rows = json.data ?? [];
    for (const r of rows) {
      if (r.type && r.type !== "Transfer") continue;
      const isIn = r.to === address;
      const isOut = r.from === address;
      if (!isIn && !isOut) continue;

      lastTimestamp = Math.max(lastTimestamp, r.block_timestamp);
      out.push({
        direction: isIn ? "in" : "out",
        counterparty: isIn ? r.from : r.to,
        amountRaw: r.value,
        amount: fromRaw(r.value, stable.decimals),
        blockNumber: 0, // Tron: block number not returned by this endpoint
        blockTime: new Date(r.block_timestamp).toISOString(),
        txHash: r.transaction_id,
      });
    }

    fingerprint = json.meta?.fingerprint ?? null;
    if (!fingerprint || rows.length < LIMIT) break;
  }

  return { transfers: out, lastTimestamp };
}

/** Read the current on-chain TRC-20 balance (decimal string) for an address. */
export async function fetchTronBalance(
  stable: Stable,
  address: string,
): Promise<string> {
  const url = `${BASE}/v1/accounts/${address}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`TronGrid HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: { trc20?: Record<string, string>[] }[];
  };

  const trc20 = json.data?.[0]?.trc20 ?? [];
  for (const entry of trc20) {
    const raw = entry[stable.contract];
    if (raw != null) return fromRaw(raw, stable.decimals);
  }
  return "0";
}
