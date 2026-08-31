// Time-window presentation model: all / this month / this week.
// Windows are computed in UTC for consistency with on-chain block timestamps.

export type WindowKey = "all" | "month" | "week";

export const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "week", label: "This week" },
];

export function isWindowKey(v: string | null | undefined): v is WindowKey {
  return v === "all" || v === "month" || v === "week";
}

/**
 * Returns the inclusive lower bound (ISO string) for a window, or null for "all".
 * - month: first day of the current UTC month at 00:00:00
 * - week:  most recent Monday (UTC) at 00:00:00
 */
export function windowStart(key: WindowKey, now: Date = new Date()): string | null {
  if (key === "all") return null;

  if (key === "month") {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    return d.toISOString();
  }

  // week — back up to Monday (ISO week start)
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString();
}
