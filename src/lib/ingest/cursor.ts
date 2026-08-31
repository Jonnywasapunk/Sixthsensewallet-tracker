import type { SupabaseClient } from "@supabase/supabase-js";
import type { Asset, Chain } from "../stables";

// A cursor marks how far a (wallet,asset) stream has been indexed so runs are
// resumable. Two backends:
//   - FileCursorStore   → .cache/ JSON files (local CLI ingestion)
//   - DbCursorStore     → derives the resume point from max(block) already in
//                         `transfers` (serverless / Vercel Cron, no writable FS)
//
// For EVM the cursor is a block number. For Tron it is a unix ms timestamp.
// Either way it is stored as a string.

export interface CursorStore {
  get(chain: Chain, address: string, asset: Asset): Promise<string | null>;
  set(chain: Chain, address: string, asset: Asset, value: string): Promise<void>;
}

function keyOf(chain: Chain, address: string, asset: Asset): string {
  return `${chain}-${address.toLowerCase()}-${asset}`;
}

// ── Filesystem backend (CLI) ────────────────────────────────────────────────
export class FileCursorStore implements CursorStore {
  constructor(private dir: string) {}

  private async ensure() {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(this.dir, { recursive: true });
  }

  private path(chain: Chain, address: string, asset: Asset) {
    return `${this.dir}/${keyOf(chain, address, asset)}.json`;
  }

  async get(chain: Chain, address: string, asset: Asset): Promise<string | null> {
    try {
      const { readFile } = await import("node:fs/promises");
      const raw = await readFile(this.path(chain, address, asset), "utf8");
      const parsed = JSON.parse(raw) as { cursor?: string };
      return parsed.cursor ?? null;
    } catch {
      return null;
    }
  }

  async set(chain: Chain, address: string, asset: Asset, value: string) {
    await this.ensure();
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      this.path(chain, address, asset),
      JSON.stringify({ cursor: value, updated_at: new Date().toISOString() }, null, 2),
    );
  }
}

// ── DB-derived backend (serverless) ─────────────────────────────────────────
// Resume from the furthest point already persisted in `transfers`. `set` is a
// no-op because the transfers themselves are the durable cursor.
export class DbCursorStore implements CursorStore {
  constructor(private db: SupabaseClient) {}

  async get(chain: Chain, address: string, asset: Asset): Promise<string | null> {
    // Find the wallet id for this chain+address, then max block/time.
    const { data: wallet } = await this.db
      .from("wallets")
      .select("id")
      .eq("chain", chain)
      .ilike("address", address)
      .maybeSingle();
    if (!wallet) return null;

    const col = chain === "tron" ? "block_time" : "block_number";
    const { data } = await this.db
      .from("transfers")
      .select(col)
      .eq("wallet_id", wallet.id)
      .eq("asset", asset)
      .order(col, { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    if (chain === "tron") {
      const t = (data as Record<string, string>).block_time;
      return t ? String(new Date(t).getTime()) : null;
    }
    const b = (data as Record<string, number>).block_number;
    return b != null ? String(b) : null;
  }

  async set(): Promise<void> {
    /* no-op — transfers are the durable cursor */
  }
}
