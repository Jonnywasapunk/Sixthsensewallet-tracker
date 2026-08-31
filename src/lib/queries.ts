import "server-only";
import { serviceClient } from "./supabase";
import { windowStart, type WindowKey } from "./time-windows";
import type { Asset } from "./stables";
import type { Balance, MovementRow, Wallet } from "./types";

export async function getWallets(): Promise<Wallet[]> {
  const db = serviceClient();
  const { data, error } = await db
    .from("wallets")
    .select("*")
    .order("label", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Wallet[];
}

export async function getBalances(walletId?: string): Promise<Balance[]> {
  const db = serviceClient();
  let q = db.from("balances").select("*");
  if (walletId) q = q.eq("wallet_id", walletId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Balance[];
}

export interface MovementQuery {
  window: WindowKey;
  walletId?: string;
  limit?: number;
  offset?: number;
}

export async function getMovements(
  opts: MovementQuery,
): Promise<MovementRow[]> {
  const db = serviceClient();
  const start = windowStart(opts.window);

  let q = db
    .from("transfers")
    .select("*, wallets!inner(label)")
    .order("block_time", { ascending: false });

  if (opts.walletId) q = q.eq("wallet_id", opts.walletId);
  if (start) q = q.gte("block_time", start);
  if (opts.limit) q = q.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => {
    const { wallets, ...rest } = r as { wallets: { label: string } } & Record<
      string,
      unknown
    >;
    return { ...(rest as unknown as MovementRow), wallet_label: wallets.label };
  });
}

export interface FlowTotals {
  asset: Asset;
  inbound: number;
  outbound: number;
  net: number;
  count: number;
}

/** Aggregate inbound/outbound totals per asset within the window. */
export async function getFlowTotals(
  opts: MovementQuery,
): Promise<FlowTotals[]> {
  const rows = await getMovements({ ...opts, limit: undefined, offset: undefined });
  const byAsset = new Map<Asset, FlowTotals>();

  for (const r of rows) {
    const cur =
      byAsset.get(r.asset) ??
      { asset: r.asset, inbound: 0, outbound: 0, net: 0, count: 0 };
    const amt = Number(r.amount);
    if (r.direction === "in") cur.inbound += amt;
    else cur.outbound += amt;
    cur.net = cur.inbound - cur.outbound;
    cur.count += 1;
    byAsset.set(r.asset, cur);
  }

  return [...byAsset.values()].sort((a, b) => a.asset.localeCompare(b.asset));
}
