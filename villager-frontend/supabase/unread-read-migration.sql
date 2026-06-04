-- 채팅 읽음 시각 (Supabase SQL Editor에서 1회 실행)
alter table public.trade_conversations
  add column if not exists buyer_last_read_at timestamptz,
  add column if not exists seller_last_read_at timestamptz;
