-- 판매자 정산 계좌 (에스크로 정산용 — PG 지급대행 연동 전)
-- 기존 DB에 1회 실행 (schema.sql 적용 후)

create type payout_account_status as enum ('pending', 'verified');

create table if not exists public.seller_payout_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bank_code text not null,
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  status payout_account_status not null default 'pending',
  verification_code text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_payout_accounts_status_idx
  on public.seller_payout_accounts (status);

alter table public.seller_payout_accounts
  add column if not exists verification_sent_at timestamptz;
