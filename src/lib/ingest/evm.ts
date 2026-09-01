import { EVM_CHAIN_ID, fromRaw, type Stable } from "../stables";

// Etherscan V2 unified endpoint. `chainid` selects the chain (Polygon = 137).
const BASE = "https://api.etherscan.io/v2/api";
const PAGE = 10000; // Etherscan hard cap per response

export interface RawTransfer {
  direction: "in" | "out";
  counterparty: string;
  amountRaw: string;
  amount: string;
  blockNumber: number;
  blockTime: string; // ISO
  txHash: string;
}

interface EtherscanTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
}

function apiKey(): string {
  const k = process.env.ETHERSCAN_API_KEY;
  if (!k) throw new Error("ETHERSCAN_API_KEY is not set");
  return k;
}

// ── Rate limiting ────────────────────────────────────────────────────────────
// The Etherscan free tier caps requests per second. A manual "Refresh now" (or
// the cron) fans out many balance/transfer calls at once and would otherwise
// trip "Max calls per sec rate limit reached". We serialize all Etherscan calls
// through a single queue with a minimum gap between them, and retry the
// transient rate-limit response a few times with backoff.
const MIN_GAP_MS = 300; // ≈3 req/s ceiling, safely under the free-tier limit
const MAX_RETRIES = 4;

let queue: Promise<unknown> = Promise.resolve();
let lastCallAt = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run `fn` on a global serialized queue, spaced ≥ MIN_GAP_MS apart. */
function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const wait = MIN_GAP_MS - (Date.now() - lastCallAt);
    if (wait > 0) await sleep(wait);
    try {
      return await fn();
    } finally {
      lastCallAt = Date.now();
    }
  };
  const result = queue.then(run, run);
  // Keep the chain alive whether or not this call resolved.
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

// Transient Etherscan V2 responses worth retrying: per-second rate limits and
// the spurious "Invalid API Key" (#err2) it returns under load even when the
// key is valid (other calls in the same run succeed with it).
function isRetryable(json: { message?: string; result?: unknown }): boolean {
  const r = typeof json.result === "string" ? json.result : "";
  const m = json.message ?? "";
  return /rate limit|invalid api key|max calls|NOTOK/i.test(`${r} ${m}`);
}

async function getJson(
  url: string,
): Promise<{ status: string; message: string; result: unknown }> {
  for (let attempt = 0; ; attempt++) {
    const json = await throttle(async () => {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`Etherscan HTTP ${res.status}`);
      return (await res.json()) as {
        status: string;
        message: string;
        result: unknown;
      };
    });
    // Don't retry a genuine empty result ("No transactions found" is status 0
    // with an empty array) — only the transient NOTOK/rate-limit/key messages.
    if (isRetryable(json) && attempt < MAX_RETRIES) {
      await sleep(500 * (attempt + 1)); // linear backoff before re-queueing
      continue;
    }
    return json;
  }
}

/**
 * Fetch TRC-20-style ERC-20 token transfers for `address` on the given stable's
 * chain, starting at `fromBlock` (inclusive). Returns transfers relative to the
 * tracked wallet, plus the highest block seen (for the cursor).
 */
export async function fetchEvmTransfers(
  stable: Stable,
  address: string,
  fromBlock: number,
): Promise<{ transfers: RawTransfer[]; lastBlock: number }> {
  const chainId = EVM_CHAIN_ID[stable.chain];
  if (!chainId) throw new Error(`No chainid mapping for ${stable.chain}`);

  const out: RawTransfer[] = [];
  const addrLc = address.toLowerCase();
  let start = fromBlock;
  let lastBlock = fromBlock;

  // Page by advancing startblock until a response returns < PAGE rows.
  for (let guard = 0; guard < 1000; guard++) {
    const url =
      `${BASE}?chainid=${chainId}&module=account&action=tokentx` +
      `&contractaddress=${stable.contract}&address=${address}` +
      `&startblock=${start}&endblock=99999999&sort=asc&page=1&offset=${PAGE}` +
      `&apikey=${apiKey()}`;

    const json = await getJson(url);
    if (json.status !== "1") {
      // "No transactions found" comes back as status 0 with empty result.
      if (json.message === "No transactions found") break;
      // Rate limit or other transient error — surface it.
      if (typeof json.result === "string") throw new Error(`Etherscan: ${json.result}`);
      break;
    }

    const rows = json.result as EtherscanTx[];
    if (rows.length === 0) break;

    for (const r of rows) {
      const block = Number(r.blockNumber);
      lastBlock = Math.max(lastBlock, block);
      const from = r.from.toLowerCase();
      const to = r.to.toLowerCase();
      const isIn = to === addrLc;
      const isOut = from === addrLc;
      if (!isIn && !isOut) continue; // shouldn't happen (filtered by address)

      out.push({
        direction: isIn ? "in" : "out",
        counterparty: isIn ? r.from : r.to,
        amountRaw: r.value,
        amount: fromRaw(r.value, stable.decimals),
        blockNumber: block,
        blockTime: new Date(Number(r.timeStamp) * 1000).toISOString(),
        txHash: r.hash,
      });
    }

    if (rows.length < PAGE) break;
    // Advance past the last block to avoid re-fetching; may re-include the
    // boundary block, but upserts are idempotent.
    start = Number(rows[rows.length - 1].blockNumber);
  }

  return { transfers: out, lastBlock };
}

/** Read the current on-chain balance (decimal string) for an address. Handles
 *  both ERC-20 tokens (tokenbalance) and the native coin (balance). */
export async function fetchEvmBalance(
  stable: Stable,
  address: string,
): Promise<string> {
  const chainId = EVM_CHAIN_ID[stable.chain];
  const url = stable.native
    ? `${BASE}?chainid=${chainId}&module=account&action=balance` +
      `&address=${address}&tag=latest&apikey=${apiKey()}`
    : `${BASE}?chainid=${chainId}&module=account&action=tokenbalance` +
      `&contractaddress=${stable.contract}&address=${address}&tag=latest` +
      `&apikey=${apiKey()}`;
  const json = await getJson(url);
  if (json.status !== "1" && typeof json.result === "string" && !/^\d+$/.test(json.result)) {
    throw new Error(`Etherscan balance: ${json.result}`);
  }
  const raw = String(json.result ?? "0");
  return fromRaw(raw, stable.decimals);
}
