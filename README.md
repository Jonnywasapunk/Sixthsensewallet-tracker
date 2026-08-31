# Sixth Sense Pay — Wallet Tracker

On-chain dashboard that indexes stablecoin activity for a registry of tracked
wallets across **Polygon** and **Tron**, presenting **balances + movements**
behind a passcode gate.

> Scope: balances and movements only. No fee/bps math, no deposit→forward
> matching, no reconciliation. Just what's held and what moved.

## Stack

- Next.js 16 (App Router, React 19), TypeScript 5
- Tailwind CSS v4 (`@tailwindcss/postcss`), CSS-variable brand theme
- Supabase (Postgres), service-role server-side only, RLS deny-by-default
- Vercel hosting + Vercel Cron for scheduled refresh
- `tsx` + `dotenv` for ingestion scripts

## Data sources

- **Polygon** via Etherscan V2 API (`chainid=137`)
- **Tron** via TronGrid (TRC-20)
- Assets defined in a single list — `src/lib/stables.ts` (`STABLES`). Adding a
  coin/chain is a one-line change. Keep the `asset` values in sync with the
  `CHECK` constraint in the migration.
- Balances are read **directly from each token contract**, never summed from
  transfers, so they're always accurate.

## Schema

`wallets` · `transfers` · `balances` — see `supabase/migrations/0001_init.sql`.
RLS is deny-by-default (no policies); the service-role key bypasses RLS and is
used only server-side.

## Setup

1. **Env** — copy `.env.example` to `.env.local` and fill in values (already
   populated for this project).
2. **Database** — run `supabase/migrations/0001_init.sql` in the Supabase SQL
   Editor for your project.
3. **Install** — `npm install`
4. **Seed wallets** — edit the list in `scripts/seed-wallets.ts`, then
   `npm run seed`
5. **Index + balances** — `npm run refresh`
6. **Dev server** — `npm run dev` → http://localhost:3000 (passcode-gated)

## Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run seed`      | Upsert the tracked-wallet registry                  |
| `npm run index`     | Index transfers only (resumable via `.cache/`)      |
| `npm run balances`  | Refresh on-chain balances only                      |
| `npm run refresh`   | Index transfers **and** refresh balances            |
| `npm run dev`       | Next.js dev server                                  |
| `npm run build`     | Production build                                     |

## Scheduled refresh

`vercel.json` defines an hourly cron hitting `/api/refresh`. The route is
protected by `CRON_SECRET`; Vercel Cron sends it as a Bearer token
automatically. On serverless the resume cursor is derived from the furthest
transfer already stored (no writable filesystem needed); the CLI scripts use
`.cache/` instead.

## Dashboard

- Passcode gate (`APP_PASSCODE`) → signed httpOnly session cookie
- Time windows: **All / This month / This week** (UTC)
- Per-wallet filter, balances panel, movement totals, movements table
- **CSV export** of the current selection (`/api/export`)

## Brand

Alternative palette — accent `#54b8d3` (cyan), dark `#0f0f0f`, cream `#f4ebe4`.
The primary red `#e93223` is intentionally never used as an accent. Fonts:
Archivo (body), Bitcount Grid Double (display). Drop the logo vector at
`public/logo.svg` and wire it into the header/login slots.
