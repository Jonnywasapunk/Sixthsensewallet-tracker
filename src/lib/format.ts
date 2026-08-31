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

/** The zones we surface for "last updated" so each regional team reads its own
 *  wall-clock time without converting. */
const UPDATED_ZONES: { label: string; tz: string }[] = [
  { label: "UTC", tz: "UTC" },
  { label: "Buenos Aires", tz: "America/Argentina/Buenos_Aires" },
  { label: "Madrid", tz: "Europe/Madrid" },
];

/** Format an instant across the tracked zones, e.g.
 *  [{label:"UTC", value:"Aug 31, 23:01"}, {label:"Buenos Aires", value:"Aug 31, 20:01"}, …].
 *  24-hour time keeps it compact and unambiguous; the date is included because
 *  Madrid can roll to the next day. */
export function fmtUpdatedZones(iso: string): { label: string; value: string }[] {
  const d = new Date(iso);
  return UPDATED_ZONES.map(({ label, tz }) => ({
    label,
    value: d.toLocaleString("en-GB", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }),
  }));
}
