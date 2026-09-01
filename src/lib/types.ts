import type { Asset, Chain } from "./stables";

export type Direction = "in" | "out";

export interface Wallet {
  id: string;
  label: string;
  chain: Chain;
  address: string;
  created_at: string;
}

export interface Transfer {
  id: string;
  wallet_id: string;
  direction: Direction;
  counterparty: string;
  amount: string; // numeric — kept as string to preserve precision
  asset: Asset;
  chain: Chain;
  block_number: number;
  block_time: string; // ISO timestamp
  tx_hash: string;
}

export interface Balance {
  wallet_id: string;
  asset: Asset;
  chain: Chain;
  amount: string; // numeric — string to preserve precision
  updated_at: string;
}

/** A transfer joined with its wallet's label — used by the dashboard. */
export interface MovementRow extends Transfer {
  wallet_label: string;
}

/** A CVU/CBU virtual-account reference (from PSVA partner Kripton).
 *  Reference-only — manually managed, no balances tracked. */
export interface Cvu {
  id: string;
  alias: string;
  cvu: string;
  numero: string | null;
  usuario: string | null;
  estado: string;
  descripcion: string;
  created_at: string;
}
