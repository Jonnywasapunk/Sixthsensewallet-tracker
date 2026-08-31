import { db, CACHE_DIR } from "./_bootstrap";
import { FileCursorStore } from "../src/lib/ingest/cursor";
import { runIngest } from "../src/lib/ingest/run";
import type { Wallet } from "../src/lib/types";

// Refresh on-chain balances only (read straight from each token contract).
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

  const summary = await runIngest(client, wallets, new FileCursorStore(CACHE_DIR), {
    transfers: false,
    balances: true,
  });
  for (const p of summary.perWallet) {
    console.log(`  ${p.wallet.padEnd(22)} ${p.asset.padEnd(5)} bal ${p.balance}`);
  }
  if (summary.errors.length) {
    for (const e of summary.errors) console.log(`  ! ${e}`);
    process.exit(1);
  }
}

main();
