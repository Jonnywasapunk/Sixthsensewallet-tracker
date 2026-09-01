import {
  fromRaw,
  MAKA_RPC_URL,
  MAKASCAN_API_URL,
  type Stable,
} from "../stables";
import type { RawTransfer } from "./evm";

// MakaChain adapter. MakaChain is EVM-compatible but NOT covered by Etherscan
// V2, so we read:
//   - balances  → JSON-RPC eth_call balanceOf (authoritative; makascan's
//                 indexed tokenbalance was observed to lag).
//   - transfers → makascan.io's Etherscan-compatible API (tokentx), which
//                 returns from/to/value/timeStamp/blockNumber.
// Everything is server-side and wallet-agnostic (no MetaMask involved).

const PAGE = 10000;

// ── Light throttle so a full refresh stays under any per-second RPC/API cap ──
let queue: Promise<unknown> = Promise.resolve();
let lastCallAt = 0;
const MIN_GAP_MS = 250;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function rpcCall(to: string, data: string): Promise<string> {
  return throttle(async () => {
    const res = await fetch(MAKA_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to, data }, "latest"],
      }),
    });
    if (!res.ok) throw new Error(`Maka RPC HTTP ${res.status}`);
    const json = (await res.json()) as { result?: string; error?: { message: string } };
    if (json.error) throw new Error(`Maka RPC: ${json.error.message}`);
    return json.result ?? "0x0";
  });
}

/** Current on-chain balance (decimal string) via eth_call balanceOf(address). */
export async function fetchMakaBalance(
  stable: Stable,
  address: string,
): Promise<string> {
  // balanceOf(address) selector 0x70a08231 + 32-byte left-padded address
  const data = `0x70a08231${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
  const raw = await rpcCall(stable.contract, data);
  const value = raw && raw !== "0x" ? BigInt(raw) : 0n;
  return fromRaw(value, stable.decimals);
}

interface MakascanTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
}

async function makascanTokenTx(
  contract: string,
  address: string,
  startBlock: number,
): Promise<MakascanTx[]> {
  return throttle(async () => {
    const url =
      `${MAKASCAN_API_URL}?module=account&action=tokentx` +
      `&contractaddress=${contract}&address=${address}` +
      `&startblock=${startBlock}&endblock=99999999&sort=asc&page=1&offset=${PAGE}` +
      (process.env.MAKASCAN_API_KEY ? `&apikey=${process.env.MAKASCAN_API_KEY}` : "");
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`makascan HTTP ${res.status}`);
    const json = (await res.json()) as {
      status: string;
      message: string;
      result: unknown;
    };
    if (json.status !== "1") {
      if (json.message === "No transactions found") return [];
      if (typeof json.result === "string") throw new Error(`makascan: ${json.result}`);
      return [];
    }
    return (json.result as MakascanTx[]) ?? [];
  });
}

/** Token transfers for `address` from `fromBlock` (inclusive), via makascan. */
export async function fetchMakaTransfers(
  stable: Stable,
  address: string,
  fromBlock: number,
): Promise<{ transfers: RawTransfer[]; lastBlock: number }> {
  const out: RawTransfer[] = [];
  const addrLc = address.toLowerCase();
  let start = fromBlock;
  let lastBlock = fromBlock;

  for (let guard = 0; guard < 1000; guard++) {
    const rows = await makascanTokenTx(stable.contract, address, start);
    if (rows.length === 0) break;

    for (const r of rows) {
      const block = Number(r.blockNumber);
      lastBlock = Math.max(lastBlock, block);
      const from = r.from.toLowerCase();
      const to = r.to.toLowerCase();
      const isIn = to === addrLc;
      const isOut = from === addrLc;
      if (!isIn && !isOut) continue;

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
    start = Number(rows[rows.length - 1].blockNumber);
  }

  return { transfers: out, lastBlock };
}
