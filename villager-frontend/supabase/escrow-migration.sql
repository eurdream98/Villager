-- 기존 Supabase DB에 에스크로 확장 컬럼 추가 (schema.sql 이미 적용된 경우 1회 실행)
-- SQL Editor에서 실행

alter table public.trade_orders
  add column if not exists refunded_at timestamptz,
  add column if not exists payment_deadline_at timestamptz,
  add column if not exists inspection_deadline_at timestamptz,
  add column if not exists disputed_at timestamptz,
  add column if not exists dispute_reason text,
  add column if not exists dispute_detail text,
  add column if not exists settlement_amount int,
  add column if not exists pending_settlement_type text,
  add column if not exists pending_settlement_amount int,
  add column if not exists pending_settlement_by uuid references public.profiles (id),
  add column if not exists pending_settlement_at timestamptz;

create index if not exists trade_orders_escrow_status_payment_deadline_idx
  on public.trade_orders (escrow_status, payment_deadline_at)
  where payment_deadline_at is not null;

create index if not exists trade_orders_escrow_status_inspection_deadline_idx
  on public.trade_orders (escrow_status, inspection_deadline_at)
  where inspection_deadline_at is not null;
