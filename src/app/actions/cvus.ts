"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Argentine CVU/CBU is 22 digits.
const CVU_RE = /^\d{22}$/;

async function assertAuthed(): Promise<void> {
  const store = await cookies();
  const ok = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/login");
}

export async function addCvu(formData: FormData): Promise<void> {
  await assertAuthed();

  const alias = String(formData.get("alias") ?? "").trim();
  const cvu = String(formData.get("cvu") ?? "").replace(/\s+/g, "");
  const numero = String(formData.get("numero") ?? "").trim() || null;
  const usuario = String(formData.get("usuario") ?? "").trim() || null;
  const estado = String(formData.get("estado") ?? "Activa") === "Inactiva"
    ? "Inactiva"
    : "Activa";
  const descripcion = String(formData.get("descripcion") ?? "").trim() ||
    "transferencia";

  if (!alias) redirect("/?cerr=alias");
  if (!CVU_RE.test(cvu)) redirect("/?cerr=invalid");

  const db = serviceClient();
  const { error } = await db
    .from("cvus")
    .insert({ alias, cvu, numero, usuario, estado, descripcion });

  if (error) {
    if (error.code === "23505") redirect("/?cerr=exists");
    throw new Error(`add cvu: ${error.message}`);
  }

  revalidatePath("/");
  redirect("/?cok=added");
}

export async function deleteCvu(formData: FormData): Promise<void> {
  await assertAuthed();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/");

  const db = serviceClient();
  const { error } = await db.from("cvus").delete().eq("id", id);
  if (error) throw new Error(`delete cvu: ${error.message}`);

  revalidatePath("/");
  redirect("/?cok=removed");
}
