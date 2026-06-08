-- 공동구매 (커뮤니티 탭) — 1회 실행
-- 기존 Villager DB에 group_buy_* 테이블 추가

create type group_buy_status as enum (
  'recruiting',
  'succeeded',
  'pickup',
  'completed',
  'failed',
  'cancelled'
);

create type group_buy_participant_tier as enum ('interested', 'committed');

create table public.group_buy_campaigns (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  price_per_unit integer not null check (price_per_unit > 0),
  external_url text,
  min_committed integer not null check (min_committed >= 2),
  max_committed integer check (max_committed is null or max_committed >= min_committed),
  deadline_at timestamptz not null,
  pickup_location text not null,
  pickup_start_at timestamptz not null,
  pickup_end_at timestamptz not null,
  pickup_notes text not null default '',
  neighborhood text,
  status group_buy_status not null default 'recruiting',
  dev_simulated_interested integer not null default 0,
  dev_simulated_committed integer not null default 0,
  succeeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pickup_end_at > pickup_start_at)
);

create table public.group_buy_campaign_images (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.group_buy_campaigns (id) on delete cascade,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.group_buy_participants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.group_buy_campaigns (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier group_buy_participant_tier not null default 'interested',
  quantity integer not null default 1 check (quantity >= 1),
  payment_ref text,
  picked_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create index idx_group_buy_campaigns_status_deadline
  on public.group_buy_campaigns (status, deadline_at desc);

create index idx_group_buy_campaigns_organizer
  on public.group_buy_campaigns (organizer_id);

create index idx_group_buy_participants_campaign
  on public.group_buy_participants (campaign_id, tier);
