-- ══════════════════════════════════════════════════════════════════════════
-- Allow additional chains: MakaChain ('maka') and Ethereum ('ethereum').
-- Widens the chain CHECK constraints on wallets/transfers/balances.
-- ARSE is already permitted by the asset CHECK, so no asset change is needed.
-- ══════════════════════════════════════════════════════════════════════════

alter table public.wallets   drop constraint if exists wallets_chain_check;
alter table public.wallets   add  constraint wallets_chain_check
  check (chain in ('polygon','tron','ethereum','maka'));

alter table public.transfers drop constraint if exists transfers_chain_check;
alter table public.transfers add  constraint transfers_chain_check
  check (chain in ('polygon','tron','ethereum','maka'));

alter table public.balances  drop constraint if exists balances_chain_check;
alter table public.balances  add  constraint balances_chain_check
  check (chain in ('polygon','tron','ethereum','maka'));
