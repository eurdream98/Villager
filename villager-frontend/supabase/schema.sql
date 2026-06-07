-- Villager 거래·채팅·약속·에스크로(확장) 스키마
-- Supabase SQL Editor에서 실행하거나 supabase db push 로 적용

-- ---------------------------------------------------------------------------
-- 공통
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- 거래 방식 (채팅 약속에서 확정)
create type trade_method as enum ('meet', 'shipping', 'door');

-- 판매 글 상태
create type listing_status as enum ('active', 'reserved', 'sold', 'hidden');

-- 약속 상태
create type appointment_status as enum ('pending', 'confirmed', 'cancelled');

-- 에스크로 거래 상태 (2단계 연동용)
create type escrow_status as enum (
  'none',              -- 현금·나눔 등
  'pending_payment',
  'paid_held',         -- 구매자 결제, 플랫폼 보관
  'seller_fulfilled',  -- 판매자 발송/배치 완료
  'buyer_confirmed',   -- 구매자 수령 확인
  'released',          -- 판매자 정산 완료
  'disputed',
  'refunded',
  'cancelled'
);

-- 판매자 정산 계좌 인증 상태
create type payout_account_status as enum ('pending', 'verified');

-- ---------------------------------------------------------------------------
-- 1. 회원 프로필 (auth.users 와 1:1)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  nickname text,
  avatar_url text,
  email text,
  provider text,
  neighborhood_id uuid, -- 아래 neighborhoods FK (nullable, 나중에 연결)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 판매자 정산 계좌 (에스크로 거래 시 판매자 본인 계좌 등록·인증)
create table public.seller_payout_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bank_code text not null,
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  status payout_account_status not null default 'pending',
  verification_code text,
  verification_sent_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seller_payout_accounts_status_idx
  on public.seller_payout_accounts (status);

-- ---------------------------------------------------------------------------
-- 2. 동네 (나무 지도·피드 필터용, 선택)
-- ---------------------------------------------------------------------------
create table public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,           -- 예: 역삼동
  slug text not null unique,           -- yeoksam
  map_x numeric(5, 2) default 50,    -- 지도 UI % (0~100)
  map_y numeric(5, 2) default 50,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_neighborhood_id_fkey
  foreign key (neighborhood_id) references public.neighborhoods (id);

-- 동네 공동 나무 (성장 기여도)
create table public.neighborhood_trees (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null unique references public.neighborhoods (id) on delete cascade,
  total_xp bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- 개인 성장 기여도
create table public.member_growth (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  neighborhood_id uuid references public.neighborhoods (id),
  action text not null,                -- trade_listing_created, trade_completed, ...
  xp_amount int not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index xp_events_user_id_created_at_idx on public.xp_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. 거래 게시글
-- ---------------------------------------------------------------------------
create table public.trade_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  neighborhood_id uuid references public.neighborhoods (id),
  neighborhood text,                   -- 동네 미연동 시 텍스트 (프론트 호환)
  title text not null,
  description text default '',
  price int not null default 0 check (price >= 0),
  is_free boolean not null default false,
  status listing_status not null default 'active',
  -- trade_methods 는 판매 등록 시 제거 → 약속에서만 확정. 레거시 호환용 nullable
  trade_methods text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trade_listings_status_created_at_idx
  on public.trade_listings (status, created_at desc);

create index trade_listings_seller_id_idx on public.trade_listings (seller_id);

-- 이미지 (Storage path + 공개 URL)
create table public.trade_listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.trade_listings (id) on delete cascade,
  storage_path text not null,          -- listings/{listing_id}/{file}
  public_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index trade_listing_images_listing_id_idx
  on public.trade_listing_images (listing_id, sort_order);

-- ---------------------------------------------------------------------------
-- 4. 채팅 (상품 + 구매자·판매자 1:1)
-- ---------------------------------------------------------------------------
create table public.trade_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.trade_listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

create index trade_conversations_buyer_id_idx on public.trade_conversations (buyer_id);
create index trade_conversations_seller_id_idx on public.trade_conversations (seller_id);

create table public.trade_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.trade_conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index trade_messages_conversation_id_created_at_idx
  on public.trade_messages (conversation_id, created_at);

-- Realtime: Supabase Dashboard → Database → trade_messages → Enable Realtime

-- ---------------------------------------------------------------------------
-- 5. 약속 잡기 (채팅방당 최신 1건 — UI와 동일)
-- ---------------------------------------------------------------------------
create table public.trade_appointments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.trade_conversations (id) on delete cascade,
  trade_method trade_method not null,
  scheduled_at timestamptz not null,
  location text not null,
  status appointment_status not null default 'pending',
  proposed_by uuid not null references public.profiles (id),
  confirmed_by uuid references public.profiles (id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 방당 활성 약속 1개 (pending/confirmed)
create unique index trade_appointments_one_active_per_conversation_idx
  on public.trade_appointments (conversation_id)
  where (status in ('pending', 'confirmed'));

-- ---------------------------------------------------------------------------
-- 6. 에스크로 거래 (PG 연동 전 설계만)
-- ---------------------------------------------------------------------------
create table public.trade_orders (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.trade_conversations (id),
  listing_id uuid not null references public.trade_listings (id),
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.profiles (id),
  appointment_id uuid references public.trade_appointments (id),
  trade_method trade_method not null,
  amount int not null default 0 check (amount >= 0),
  escrow_status escrow_status not null default 'pending_payment',
  paid_at timestamptz,
  fulfilled_at timestamptz,            -- 판매자 발송/배치
  confirmed_at timestamptz,            -- 구매자 수령 확인 → 검수 타이머 시작
  released_at timestamptz,
  refunded_at timestamptz,
  payment_deadline_at timestamptz,     -- 약속 확정 후 구매자 결제 기한
  inspection_deadline_at timestamptz,  -- 수령 확인 후 자동 정산 기한
  receipt_confirm_deadline_at timestamptz, -- 이행 후 자동 수령 확정 기한
  disputed_at timestamptz,
  dispute_reason text,
  dispute_detail text,
  settlement_amount int,               -- 최종 판매자 정산액 (부분 환불 시)
  pending_settlement_type text,        -- keep_full | return_refund | partial_refund
  pending_settlement_amount int,
  pending_settlement_by uuid references public.profiles (id),
  pending_settlement_at timestamptz,
  payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trade_orders_escrow_status_payment_deadline_idx
  on public.trade_orders (escrow_status, payment_deadline_at)
  where payment_deadline_at is not null;

create index trade_orders_escrow_status_inspection_deadline_idx
  on public.trade_orders (escrow_status, inspection_deadline_at)
  where inspection_deadline_at is not null;

create index trade_orders_seller_fulfilled_receipt_deadline_idx
  on public.trade_orders (escrow_status, receipt_confirm_deadline_at)
  where escrow_status = 'seller_fulfilled' and receipt_confirm_deadline_at is not null;

-- ---------------------------------------------------------------------------
-- 뷰: 피드용 (프론트 trade.js select 와 맞춤)
-- ---------------------------------------------------------------------------
create or replace view public.trade_listings_feed as
select
  l.id,
  l.title,
  l.description,
  l.price,
  l.is_free,
  l.neighborhood,
  l.status,
  l.created_at,
  l.seller_id,
  coalesce(p.display_name, p.nickname, '이웃') as seller_name,
  coalesce(
    array_agg(i.public_url order by i.sort_order) filter (where i.id is not null),
    '{}'
  ) as image_urls
from public.trade_listings l
join public.profiles p on p.id = l.seller_id
left join public.trade_listing_images i on i.listing_id = l.id
where l.status = 'active'
group by l.id, p.display_name, p.nickname;

-- ---------------------------------------------------------------------------
-- 트리거: profiles 자동 생성 (OAuth 가입 시)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email, provider)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    new.email,
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  );
  insert into public.member_growth (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trade_listings_updated_at before update on public.trade_listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS (요약 — 운영 시 세부 조정)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trade_listings enable row level security;
alter table public.trade_listing_images enable row level security;
alter table public.trade_conversations enable row level security;
alter table public.trade_messages enable row level security;
alter table public.trade_appointments enable row level security;
alter table public.trade_orders enable row level security;
alter table public.member_growth enable row level security;
alter table public.xp_events enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.neighborhood_trees enable row level security;

-- profiles: 본인 수정, 전체 읽기(닉네임)
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- listings: active 는 누구나 읽기, 본인만 쓰기/수정
create policy "listings_select_active" on public.trade_listings
  for select using (status = 'active' or seller_id = auth.uid());
create policy "listings_insert_own" on public.trade_listings
  for insert with check (seller_id = auth.uid());
create policy "listings_update_own" on public.trade_listings
  for update using (seller_id = auth.uid());

-- images: listing 소유자만
create policy "listing_images_select" on public.trade_listing_images
  for select using (true);
create policy "listing_images_insert" on public.trade_listing_images
  for insert with check (
    exists (
      select 1 from public.trade_listings l
      where l.id = listing_id and l.seller_id = auth.uid()
    )
  );

-- conversations: 참여자만
create policy "conversations_select_participant" on public.trade_conversations
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "conversations_insert_buyer" on public.trade_conversations
  for insert with check (buyer_id = auth.uid() and buyer_id <> seller_id);

-- messages: 참여 방만
create policy "messages_select_participant" on public.trade_messages
  for select using (
    exists (
      select 1 from public.trade_conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );
create policy "messages_insert_participant" on public.trade_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.trade_conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- appointments: 참여자만
create policy "appointments_select_participant" on public.trade_appointments
  for select using (
    exists (
      select 1 from public.trade_conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );
create policy "appointments_insert_participant" on public.trade_appointments
  for insert with check (
    proposed_by = auth.uid()
    and exists (
      select 1 from public.trade_conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );
create policy "appointments_update_participant" on public.trade_appointments
  for update using (
    exists (
      select 1 from public.trade_conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- neighborhoods / trees: 읽기 공개
create policy "neighborhoods_select" on public.neighborhoods for select using (true);
create policy "neighborhood_trees_select" on public.neighborhood_trees for select using (true);

-- member_growth: 본인 읽기
create policy "member_growth_select_own" on public.member_growth
  for select using (user_id = auth.uid());

-- Storage bucket: trade-listings (Dashboard에서 생성)
-- policies: authenticated upload to own folder, public read
