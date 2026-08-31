import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client. SERVER ONLY — never import this into a client component.
// The `server-only` import above makes a client-side import a build error.
//
// RLS is deny-by-default; the service-role key bypasses RLS, which is why it
// must never reach the browser. All reads/writes for the dashboard and the
// ingestion scripts go through this client.

let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
