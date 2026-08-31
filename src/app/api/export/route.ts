import { NextResponse, type NextRequest } from "next/server";
import { getMovements } from "@/lib/queries";
import { isWindowKey, type WindowKey } from "@/lib/time-windows";

export const dynamic = "force-dynamic";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const window: WindowKey = isWindowKey(sp.get("w")) ? (sp.get("w") as WindowKey) : "all";
  const walletParam = sp.get("wallet");
  const walletId = walletParam && walletParam !== "all" ? walletParam : undefined;

  const rows = await getMovements({ window, walletId });

  const header = [
    "block_time_utc",
    "wallet",
    "direction",
    "counterparty",
    "amount",
    "asset",
    "chain",
    "block_number",
    "tx_hash",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.block_time,
        csvCell(r.wallet_label),
        r.direction,
        r.counterparty,
        r.amount,
        r.asset,
        r.chain,
        r.block_number,
        r.tx_hash,
      ].join(","),
    );
  }

  const body = lines.join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const scope = walletId ? "wallet" : "all";
  const filename = `ssp-movements-${window}-${scope}-${stamp}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
