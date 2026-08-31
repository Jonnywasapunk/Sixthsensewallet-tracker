"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { DbCursorStore } from "@/lib/ingest/cursor";
import { runIngest } from "@/lib/ingest/run";
import type { Chain } from "@/lib/stables";
import type { Wallet } from "@/lib/types";

// Address shapes. EVM = 0x + 40 hex. Tron = base58, 'T' + 33 chars (no 0/O/I/l).
const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const TRON_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

function isValidAddress(chain: Chain, address: string): boolean {
  return chain === "tron" ? TRON_RE.test(address) : EVM_RE.test(address);
}

/** The passcode gate also POSTs actions, but re-check here: actions are a
 *  public POST endpoint and render-time gating is not a security boundary. */
async function assertAuthed(): Promise<void> {
  const store = await cookies();
  const ok = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/login");
}

export async function addWallet(formData: FormData): Promise<void> {
  await assertAuthed();

  const label = String(formData.get("label") ?? "").trim();
  const chainRaw = String(formData.get("chain") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const chain: Chain = chainRaw === "tron" ? "tron" : "polygon";

  if (!label) redirect("/?werr=name");
  if (!isValidAddress(chain, address)) redirect("/?werr=invalid");

  const db = serviceClient();
  const { data: inserted, error } = await db
    .from("wallets")
    .insert({ label, chain, address })
    .select("*")
    .single();

  if (error) {
    // 23505 = unique_violation on (chain, address)
    if (error.code === "23505") redirect("/?werr=exists");
    throw new Error(`add wallet: ${error.message}`);
  }

  // Best-effort immediate balance load so the new wallet isn't blank. Transfer
  // history is a potentially long backfill — left to the hourly cron. A failure
  // here (e.g. an explorer rate limit) must not undo the successful insert.
  try {
    await runIngest(db, [inserted as Wallet], new DbCursorStore(db), {
      transfers: false,
      balances: true,
    });
  } catch {
    /* ignore — cron will populate on the next run */
  }

  revalidatePath("/");
  redirect("/?wok=added");
}

export async function deleteWallet(formData: FormData): Promise<void> {
  await assertAuthed();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/");

  const db = serviceClient();
  // Delete by id; transfers/balances cascade via the FK. (No ownership model —
  // this is a single shared-passcode deployment.)
  const { error } = await db.from("wallets").delete().eq("id", id);
  if (error) throw new Error(`delete wallet: ${error.message}`);

  revalidatePath("/");
  redirect("/?wok=removed");
}
