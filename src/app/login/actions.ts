"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, makeSessionToken } from "@/lib/session";

export async function login(formData: FormData): Promise<void> {
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  const expected = process.env.APP_PASSCODE;
  if (!expected) throw new Error("APP_PASSCODE is not set");

  if (passcode !== expected) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await makeSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect(next.startsWith("/") ? next : "/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
