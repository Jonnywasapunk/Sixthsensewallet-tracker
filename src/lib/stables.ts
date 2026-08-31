// ─────────────────────────────────────────────────────────────────────────────
// STABLES — the single source of truth for tracked assets.
// Adding a coin/chain is a ONE-LINE change here. Everything (indexer, balances,
// schema CHECK constraint, dashboard) reads from this list.
//
// `asset` values MUST stay in sync with the CHECK constraint in the migration
// (supabase/migrations/0001_init.sql): asset IN ('USDT','USDC').
// ─────────────────────────────────────────────────────────────────────────────

export type Chain = "polygon" | "tron";
export type Asset = "USDT" | "USDC";

export interface Stable {
  asset: Asset;
  chain: Chain;
  /** Token contract address (checksum for EVM, base58 for Tron). */
  contract: string;
  /** Token decimals — used to convert raw integer amounts to human units. */
  decimals: number;
}

export const STABLES: Stable[] = [
  // ── Polygon (chainid 137) ──────────────────────────────────────────────────
  {
    asset: "USDT",
    chain: "polygon",
    contract: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
  },
  {
    // Native (Circle) USDC on Polygon. If these wallets hold bridged USDC.e,
    // swap this contract for 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174.
    asset: "USDC",
    chain: "polygon",
    contract: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
  },

  // ── Tron (TRC-20) ──────────────────────────────────────────────────────────
  {
    asset: "USDT",
    chain: "tron",
    contract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6,
  },
  {
    asset: "USDC",
    chain: "tron",
    contract: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
    decimals: 6,
  },
];

export const CHAINS: Chain[] = ["polygon", "tron"];
export const ASSETS: Asset[] = ["USDT", "USDC"];

/** Etherscan V2 chainid per EVM chain. */
export const EVM_CHAIN_ID: Record<string, number> = {
  polygon: 137,
};

/** All stables for a given chain. */
export function stablesForChain(chain: Chain): Stable[] {
  return STABLES.filter((s) => s.chain === chain);
}

/** Convert a raw integer token amount (string/bigint) to a decimal string. */
export function fromRaw(raw: string | bigint, decimals: number): string {
  const v = typeof raw === "bigint" ? raw : BigInt(raw);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const out = fracStr ? `${whole}.${fracStr}` : `${whole}`;
  return neg ? `-${out}` : out;
}
