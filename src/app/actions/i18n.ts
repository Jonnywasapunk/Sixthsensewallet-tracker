"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/**
 * Set the UI language. Bound with a locale at the call site
 * (`setLocale.bind(null, "es")`) so it works as a plain <form action> with no
 * client JS. Setting the cookie + revalidatePath re-renders the current page
 * in the new language in a single roundtrip.
 */
export async function setLocale(locale: Locale): Promise<void> {
  const value: Locale = isLocale(locale) ? locale : "en";
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    httpOnly: false, // purely a UI preference — safe to read client-side too
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  revalidatePath("/", "layout");
}
