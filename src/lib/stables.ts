// ─────────────────────────────────────────────────────────────────────────────
// STABLES — the single source of truth for tracked assets.
// Adding a coin/chain is a ONE-LINE change here. Everything (indexer, balances,
// schema CHECK constraint, dashboard) reads from this list.
//
// `asset` values MUST stay in sync with the CHECK constraint in the migration
// (supabase/migrations/0001_init.sql): asset IN ('USDT','USDC').
// ─────────────────────────────────────────────────────────────────────────────

export type Chain = "polygon" | "tron" | "ethereum" | "maka";
export type Asset = "USDT" | "USDC" | "POL" | "ARSE";

export interface Stable {
  asset: Asset;
  chain: Chain;
  /** Token contract address (checksum for EVM, base58 for Tron). Use "native"
   *  for a chain's native coin (no ERC-20/TRC-20 contract). */
  contract: string;
  /** Token decimals — used to convert raw integer amounts to human units. */
  decimals: number;
  /** Native chain coin (e.g. POL on Polygon): balance-only, no transfer index. */
  native?: boolean;
}

export const STABLES: Stable[] = [
  // ── Polygon (chainid 137) ──────────────────────────────────────────────────
  {
    // Native Polygon coin (POL, formerly MATIC). Balance-only — read via the
    // account balance call, not tokenbalance. No transfers indexed.
    asset: "POL",
    chain: "polygon",
    contract: "native",
    decimals: 18,
    native: true,
  },
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
  {
    // ARSE stablecoin on Polygon (on-chain symbol "ARSe"), verified on-chain.
    asset: "ARSE",
    chain: "polygon",
    contract: "0x2278485e81b735E0F79fDca936F901D0727E6603",
    decimals: 6,
  },

  // ── MakaChain (chainid 777178, EVM) ─────────────────────────────────────────
  {
    // ARSE (on-chain symbol "ARSe") on MakaChain — verified on-chain via
    // rpc.makachain.io. Indexed through the Maka adapter (RPC balances +
    // makascan.io Etherscan-compatible API for transfers), NOT Etherscan V2.
    asset: "ARSE",
    chain: "maka",
    contract: "0xB82A23dD2C2F4cd25FDAf9027f7c7ca3e26BA511",
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
export const ASSETS: Asset[] = ["USDT", "USDC", "POL", "ARSE"];

/** Stables that have indexable transfers (excludes native coins). */
export function tokenStablesForChain(chain: Chain): Stable[] {
  return STABLES.filter((s) => s.chain === chain && !s.native);
}

/** Etherscan V2 chainid per EVM chain served by Etherscan (NOT MakaChain). */
export const EVM_CHAIN_ID: Record<string, number> = {
  polygon: 137,
  ethereum: 1,
};

/** MakaChain (chainid 777178) — indexed via its own RPC + makascan API, not
 *  Etherscan. Endpoints are overridable via env for prod. */
export const MAKA_CHAIN_ID = 777178;
export const MAKA_RPC_URL =
  process.env.MAKA_RPC_URL ?? "https://rpc.makachain.io";
export const MAKASCAN_API_URL =
  process.env.MAKASCAN_API_URL ?? "https://makascan.io/api";

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
