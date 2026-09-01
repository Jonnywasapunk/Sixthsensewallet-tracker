"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { DbCursorStore } from "@/lib/ingest/cursor";
import { runIngest } from "@/lib/ingest/run";
import type { Wallet } from "@/lib/types";

/**
 * Manual "Refresh now" — the same indexing the hourly cron runs, triggered from
 * the dashboard. Fetches new transfers and re-reads balances for every wallet.
 * Re-authorizes here because a Server Action is a public POST endpoint.
 */
export async function refreshNow(): Promise<void> {
  const store = await cookies();
  const ok = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/login");

  const db = serviceClient();
  const { data, error } = await db.from("wallets").select("*");
  if (error) throw new Error(`refresh: ${error.message}`);

  const wallets = (data ?? []) as Wallet[];
  const summary = await runIngest(db, wallets, new DbCursorStore(db));

  revalidatePath("/");
  redirect(summary.errors.length > 0 ? "/?rerr=1" : "/?rok=1");
}
