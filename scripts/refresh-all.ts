import { db, CACHE_DIR } from "./_bootstrap";
import { FileCursorStore } from "../src/lib/ingest/cursor";
import { runIngest } from "../src/lib/ingest/run";
import type { Wallet } from "../src/lib/types";

// Index transfers AND refresh balances for every tracked wallet, using
// resumable per-wallet/per-asset cursors in .cache/.
async function main() {
  const client = db();
  const { data, error } = await client.from("wallets").select("*");
  if (error) {
    console.error("Failed to load wallets:", error.message);
    process.exit(1);
  }
  const wallets = (data ?? []) as Wallet[];
  if (wallets.length === 0) {
    console.log("No wallets registered. Run `npm run seed` first.");
    return;
  }

  console.log(`Indexing ${wallets.length} wallet(s)…`);
  const summary = await runIngest(client, wallets, new FileCursorStore(CACHE_DIR));

  console.log("\n── Summary ──────────────────────────────");
  for (const p of summary.perWallet) {
    console.log(
      `  ${p.wallet.padEnd(22)} ${p.asset.padEnd(5)} +${p.transfers} txns · bal ${p.balance}`,
    );
  }
  console.log(
    `\nTransfers upserted: ${summary.transfersUpserted} · Balances updated: ${summary.balancesUpdated}`,
  );
  if (summary.errors.length) {
    console.log("\nErrors:");
    for (const e of summary.errors) console.log(`  ! ${e}`);
    process.exit(1);
  }
}

main();
