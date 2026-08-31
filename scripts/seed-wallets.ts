import { db } from "./_bootstrap";
import type { Chain } from "../src/lib/stables";

// ── Tracked wallet registry ──────────────────────────────────────────────────
// Edit this list to add/relabel wallets, then run: npm run seed
const WALLETS: { label: string; chain: Chain; address: string }[] = [
  {
    label: "Arse Minting Wallet",
    chain: "polygon",
    address: "0x8De6355D332d504089a752cf4Bb2CE076Ce318E9",
  },
  {
    label: "Arse Holding Wallet",
    chain: "polygon",
    address: "0xF017EA95Ef37D6CCbC8bd09545c4d688f14F0E59",
  },
  {
    label: "Arse Tron Wallet",
    chain: "tron",
    address: "TSTWTBtg7sN8epWLe8Vj3uqKVvgozaw7U4",
  },
];

async function main() {
  const client = db();
  const { data, error } = await client
    .from("wallets")
    .upsert(WALLETS, { onConflict: "chain,address" })
    .select();
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log(`Seeded ${data?.length ?? 0} wallet(s):`);
  for (const w of data ?? []) console.log(`  • ${w.label} [${w.chain}] ${w.address}`);
}

main();
