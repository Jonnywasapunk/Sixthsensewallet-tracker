-- ══════════════════════════════════════════════════════════════════════════
-- Sixth Sense Pay — wallet balance & movement tracker
-- Schema: wallets / transfers / balances
-- RLS: deny-by-default (no policies). The app uses the service-role key
--      server-side only, which bypasses RLS. Anon/authenticated get nothing.
-- ══════════════════════════════════════════════════════════════════════════

-- ── wallets ────────────────────────────────────────────────────────────────
create table if not exists public.wallets (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  chain      text not null check (chain in ('polygon','tron')),
  address    text not null,
  created_at timestamptz not null default now(),
  unique (chain, address)
);

-- ── transfers ──────────────────────────────────────────────────────────────
create table if not exists public.transfers (
  id            uuid primary key default gen_random_uuid(),
  wallet_id     uuid not null references public.wallets(id) on delete cascade,
  direction     text not null check (direction in ('in','out')),
  counterparty  text not null,
  amount        numeric not null,
  asset         text not null check (asset in ('USDT','USDC')),
  chain         text not null check (chain in ('polygon','tron')),
  block_number  bigint not null default 0,
  block_time    timestamptz not null,
  tx_hash       text not null,
  created_at    timestamptz not null default now(),
  -- Idempotent ingestion: one row per (chain, tx, wallet, direction, cp, amount)
  unique (chain, tx_hash, wallet_id, direction, counterparty, amount)
);

create index if not exists transfers_wallet_time_idx
  on public.transfers (wallet_id, block_time desc);
create index if not exists transfers_time_idx
  on public.transfers (block_time desc);
create index if not exists transfers_asset_idx
  on public.transfers (asset);

-- ── balances ───────────────────────────────────────────────────────────────
-- Latest known on-chain balance per wallet/asset (read from the contract, not
-- summed from transfers). One row per (wallet, asset).
create table if not exists public.balances (
  wallet_id  uuid not null references public.wallets(id) on delete cascade,
  asset      text not null check (asset in ('USDT','USDC')),
  chain      text not null check (chain in ('polygon','tron')),
  amount     numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (wallet_id, asset)
);

-- ── RLS: deny-by-default ─────────────────────────────────────────────────────
alter table public.wallets   enable row level security;
alter table public.transfers enable row level security;
alter table public.balances  enable row level security;
-- No policies are created: anon & authenticated roles are denied all access.
-- The service-role key (server-side only) bypasses RLS by design.
