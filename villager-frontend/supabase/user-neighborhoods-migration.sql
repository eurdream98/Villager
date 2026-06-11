-- 동네 2개 등록 + GPS 인증 (당근마켓 스타일)
-- Supabase SQL Editor에서 1회 실행

alter table public.neighborhoods
  add column if not exists center_lat double precision,
  add column if not exists center_lng double precision,
  add column if not exists verify_radius_m integer not null default 2000;

comment on column public.neighborhoods.center_lat is '동네 중심 위도 (인증 거리 계산용)';
comment on column public.neighborhoods.center_lng is '동네 중심 경도 (인증 거리 계산용)';
comment on column public.neighborhoods.verify_radius_m is '인증 허용 반경(미터), 기본 2km';

create table if not exists public.user_neighborhoods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  neighborhood_id uuid not null references public.neighborhoods (id) on delete restrict,
  slot smallint not null check (slot in (1, 2)),
  verified boolean not null default false,
  verified_at timestamptz,
  verified_expires_at timestamptz,
  verified_lat double precision,
  verified_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot),
  unique (user_id, neighborhood_id)
);

create index if not exists user_neighborhoods_user_id_idx
  on public.user_neighborhoods (user_id);

create index if not exists user_neighborhoods_neighborhood_id_idx
  on public.user_neighborhoods (neighborhood_id);

drop trigger if exists user_neighborhoods_updated_at on public.user_neighborhoods;
create trigger user_neighborhoods_updated_at
  before update on public.user_neighborhoods
  for each row execute function public.set_updated_at();

insert into public.user_neighborhoods (user_id, neighborhood_id, slot, verified)
select p.id, p.neighborhood_id, 1, false
from public.profiles p
where p.neighborhood_id is not null
on conflict (user_id, slot) do nothing;

update public.trade_listings l
set neighborhood_id = n.id
from public.neighborhoods n
where l.neighborhood_id is null
  and l.neighborhood is not null
  and trim(l.neighborhood) = n.name;

update public.neighborhoods set
  center_lat = 37.5009, center_lng = 127.0366, verify_radius_m = 2000
where slug = 'yeoksam';

update public.neighborhoods set
  center_lat = 37.5563, center_lng = 126.9100, verify_radius_m = 2000
where slug = 'mangwon';

update public.neighborhoods set
  center_lat = 37.5445, center_lng = 127.0559, verify_radius_m = 2000
where slug = 'seongsu';

alter table public.user_neighborhoods enable row level security;

drop policy if exists "user_neighborhoods_select_own" on public.user_neighborhoods;
create policy "user_neighborhoods_select_own"
  on public.user_neighborhoods for select
  using (user_id = auth.uid());

drop policy if exists "user_neighborhoods_insert_own" on public.user_neighborhoods;
create policy "user_neighborhoods_insert_own"
  on public.user_neighborhoods for insert
  with check (user_id = auth.uid());

drop policy if exists "user_neighborhoods_update_own" on public.user_neighborhoods;
create policy "user_neighborhoods_update_own"
  on public.user_neighborhoods for update
  using (user_id = auth.uid());

drop policy if exists "user_neighborhoods_delete_own" on public.user_neighborhoods;
create policy "user_neighborhoods_delete_own"
  on public.user_neighborhoods for delete
  using (user_id = auth.uid());
