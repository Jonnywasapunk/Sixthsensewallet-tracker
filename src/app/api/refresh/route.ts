import { NextResponse, type NextRequest } from "next/server";
import { serviceClient } from "@/lib/supabase";
import { DbCursorStore } from "@/lib/ingest/cursor";
import { runIngest } from "@/lib/ingest/run";
import type { Wallet } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow the indexer time to run

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // Allow manual trigger via ?key= for convenience/testing.
  return req.nextUrl.searchParams.get("key") === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = serviceClient();
  const { data, error } = await db.from("wallets").select("*");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const wallets = (data ?? []) as Wallet[];
  const summary = await runIngest(db, wallets, new DbCursorStore(db));

  const status = summary.errors.length > 0 ? 207 : 200;
  return NextResponse.json({ ok: summary.errors.length === 0, summary }, { status });
}
