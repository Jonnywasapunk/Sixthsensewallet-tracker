-- ══════════════════════════════════════════════════════════════════════════
-- CVUs — reference list of virtual accounts (CVU/CBU) provided by the PSVA
-- partner (Kripton). Reference-only: manually added/removed, no balances or
-- on-chain indexing. Same RLS posture as the rest of the schema.
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists public.cvus (
  id          uuid primary key default gen_random_uuid(),
  alias       text not null,
  cvu         text not null,
  numero      text,
  usuario     text,
  estado      text not null default 'Activa',
  descripcion text not null default 'transferencia',
  created_at  timestamptz not null default now(),
  unique (cvu)
);

create index if not exists cvus_alias_idx on public.cvus (alias);

alter table public.cvus enable row level security;
-- No policies: anon & authenticated are denied. The service-role key
-- (server-side only) bypasses RLS, matching wallets/transfers/balances.
