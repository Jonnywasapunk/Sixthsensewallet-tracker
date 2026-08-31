import type { Chain } from "./stables";

/** Format a decimal-string amount with thousands separators, up to 6 dp. */
export function fmtAmount(amount: string | number): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/** Shorten an address for display: 0x1234…abcd */
export function shortAddr(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Block explorer URL for a tx hash on a given chain. */
export function txUrl(chain: Chain, hash: string): string {
  if (chain === "polygon") return `https://polygonscan.com/tx/${hash}`;
  return `https://tronscan.org/#/transaction/${hash}`;
}

/** Block explorer URL for an address on a given chain. */
export function addrUrl(chain: Chain, addr: string): string {
  if (chain === "polygon") return `https://polygonscan.com/address/${addr}`;
  return `https://tronscan.org/#/address/${addr}`;
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}
