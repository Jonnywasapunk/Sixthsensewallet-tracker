// Session token for the shared-passcode gate.
//
// On successful passcode entry we set an httpOnly cookie whose value is an
// HMAC-SHA256 signature over a fixed payload, keyed by SESSION_SECRET. The
// middleware/server recomputes the signature and compares in constant time.
// A single shared passcode means a single valid token value.
//
// Uses Web Crypto so it runs in both the Node.js server and middleware runtime.

const PAYLOAD = "ssp.session.v1";
export const SESSION_COOKIE = "ssp_session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

async function hmac(payload: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(payload));
  return Buffer.from(new Uint8Array(sig)).toString("hex");
}

/** The valid cookie value for the current SESSION_SECRET. */
export async function makeSessionToken(): Promise<string> {
  return hmac(PAYLOAD, secret());
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Verify a cookie value against the expected token. */
export async function verifySessionToken(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  const expected = await makeSessionToken();
  return constantTimeEqual(value, expected);
}
