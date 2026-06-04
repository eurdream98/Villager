-- 판매자 이행 후 자동 수령 확정 기한 (1회 실행)
alter table public.trade_orders
  add column if not exists receipt_confirm_deadline_at timestamptz;

create index if not exists trade_orders_seller_fulfilled_receipt_deadline_idx
  on public.trade_orders (escrow_status, receipt_confirm_deadline_at)
  where escrow_status = 'seller_fulfilled' and receipt_confirm_deadline_at is not null;

-- 이미 이행 완료된 주문에 기한 보정 (7일)
update public.trade_orders
set receipt_confirm_deadline_at = fulfilled_at + interval '168 hours'
where escrow_status = 'seller_fulfilled'
  and fulfilled_at is not null
  and receipt_confirm_deadline_at is null;
