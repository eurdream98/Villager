-- Villager 더미 데이터 (schema.sql 적용 후 실행)
-- Supabase SQL Editor에서 붙여넣기 후 Run
--
-- 사전 조건
--   1. schema.sql 적용 완료
--   2. 앱에서 OAuth 로그인 1회 이상 (profiles · member_growth 자동 생성)
--   3. 채팅·약속 데모: OAuth 계정 2개 (판매자·구매자)
--
-- 최신 가입자 = 판매자, 그 다음 가입자 = 구매자(채팅용)로 사용합니다.

-- ---------------------------------------------------------------------------
-- 동네 · 동네 나무 (인증 불필요, 여러 번 실행 가능)
-- ---------------------------------------------------------------------------
insert into public.neighborhoods (id, name, slug, map_x, map_y, center_lat, center_lng, verify_radius_m)
values
  ('a1111111-1111-1111-1111-111111111111', '역삼동', 'yeoksam', 62, 38, 37.5009, 127.0366, 2000),
  ('a2222222-2222-2222-2222-222222222222', '망원동', 'mangwon', 28, 52, 37.5563, 126.9100, 2000),
  ('a3333333-3333-3333-3333-333333333333', '성수동', 'seongsu', 72, 58, 37.5445, 127.0559, 2000)
on conflict (slug) do update set
  name = excluded.name,
  map_x = excluded.map_x,
  map_y = excluded.map_y,
  center_lat = excluded.center_lat,
  center_lng = excluded.center_lng,
  verify_radius_m = excluded.verify_radius_m;

insert into public.neighborhood_trees (neighborhood_id, total_xp)
select n.id, v.total_xp
from public.neighborhoods n
join (values
  ('yeoksam', 12400::bigint),
  ('mangwon', 8900::bigint),
  ('seongsu', 15200::bigint)
) as v(slug, total_xp) on v.slug = n.slug
on conflict (neighborhood_id) do update set
  total_xp = excluded.total_xp,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 거래 글 · 이미지 · 성장 XP (로그인 사용자 1명 필요)
-- PL/pgSQL 변수는 v_ 접두사 (buyer_id/seller_id 컬럼과 충돌 방지)
-- ---------------------------------------------------------------------------
do $$
declare
  v_seller_id uuid;
  v_buyer_id uuid;
  v_listing1 uuid := 'b1111111-1111-1111-1111-111111111111';
  v_listing2 uuid := 'b2222222-2222-2222-2222-222222222222';
  v_listing3 uuid := 'b3333333-3333-3333-3333-333333333333';
  v_conv_id uuid := 'c1111111-1111-1111-1111-111111111111';
begin
  select id into v_seller_id
  from auth.users
  order by created_at desc
  limit 1;

  if v_seller_id is null then
    raise exception 'auth.users 가 비어 있습니다. 앱에서 OAuth 로그인 후 다시 실행하세요.';
  end if;

  if not exists (select 1 from public.profiles where id = v_seller_id) then
    insert into public.profiles (id, display_name, email, provider)
    select
      v_seller_id,
      coalesce(
        raw_user_meta_data->>'nickname',
        raw_user_meta_data->>'name',
        '이웃'
      ),
      email,
      coalesce(raw_app_meta_data->>'provider', 'email')
    from auth.users
    where id = v_seller_id;
    insert into public.member_growth (user_id, total_xp) values (v_seller_id, 0)
    on conflict (user_id) do nothing;
  end if;

  update public.member_growth
  set total_xp = 420, updated_at = now()
  where user_id = v_seller_id;

  insert into public.xp_events (user_id, action, xp_amount, metadata)
  select v_seller_id, 'seed_demo', 50, '{"label":"시드 데이터"}'::jsonb
  where not exists (
    select 1 from public.xp_events
    where user_id = v_seller_id and action = 'seed_demo'
  );

  insert into public.trade_listings (
    id, seller_id, neighborhood_id, neighborhood, title, description, price, is_free, status
  )
  values
    (
      v_listing1,
      v_seller_id,
      'a1111111-1111-1111-1111-111111111111',
      '역삼동',
      '아이패드 미니 6세대 64GB',
      '생활기스 약간 있습니다. 직거래·택배 모두 가능해요.',
      320000,
      false,
      'active'
    ),
    (
      v_listing2,
      v_seller_id,
      'a1111111-1111-1111-1111-111111111111',
      '역삼동',
      '무선 키보드 (로지텍)',
      '거의 새 제품입니다. 나눔도 환영해요.',
      0,
      true,
      'active'
    ),
    (
      v_listing3,
      v_seller_id,
      'a2222222-2222-2222-2222-222222222222',
      '망원동',
      '캠핑 의자 2개',
      '접이식 의자 2개 세트입니다.',
      45000,
      false,
      'active'
    )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    price = excluded.price,
    is_free = excluded.is_free,
    neighborhood_id = excluded.neighborhood_id,
    neighborhood = excluded.neighborhood,
    updated_at = now();

  delete from public.trade_listing_images
  where listing_id in (v_listing1, v_listing2, v_listing3)
    and storage_path like 'seed/%';

  insert into public.trade_listing_images (listing_id, storage_path, public_url, sort_order)
  values
    (v_listing1, 'seed/listing1/0', 'https://picsum.photos/seed/villager-ipad/800/600', 0),
    (v_listing1, 'seed/listing1/1', 'https://picsum.photos/seed/villager-ipad2/800/600', 1),
    (v_listing2, 'seed/listing2/0', 'https://picsum.photos/seed/villager-kb/800/600', 0),
    (v_listing3, 'seed/listing3/0', 'https://picsum.photos/seed/villager-chair/800/600', 0);

  -- -------------------------------------------------------------------------
  -- 채팅·약속 데모 (구매자 = 두 번째로 가입한 계정, 판매자와 달라야 함)
  -- -------------------------------------------------------------------------
  select id into v_buyer_id
  from auth.users
  where id <> v_seller_id
  order by created_at desc
  limit 1;

  if v_buyer_id is not null then
    insert into public.profiles (id, display_name, email, provider)
    select
      v_buyer_id,
      coalesce(
        raw_user_meta_data->>'nickname',
        raw_user_meta_data->>'name',
        '구매자'
      ),
      email,
      coalesce(raw_app_meta_data->>'provider', 'email')
    from auth.users
    where id = v_buyer_id
    on conflict (id) do nothing;

    insert into public.member_growth (user_id, total_xp)
    values (v_buyer_id, 180)
    on conflict (user_id) do update set total_xp = 180, updated_at = now();

    insert into public.trade_conversations (id, listing_id, buyer_id, seller_id)
    values (v_conv_id, v_listing1, v_buyer_id, v_seller_id)
    on conflict (listing_id, buyer_id) do update set updated_at = now();

    select c.id into v_conv_id
    from public.trade_conversations c
    where c.listing_id = v_listing1 and c.buyer_id = v_buyer_id;

    insert into public.trade_messages (conversation_id, sender_id, body, is_system)
    select v_conv_id, v_buyer_id, '안녕하세요! 아직 판매 중인가요?', false
    where not exists (
      select 1 from public.trade_messages m
      where m.conversation_id = v_conv_id and m.body like '안녕하세요!%'
    );

    insert into public.trade_messages (conversation_id, sender_id, body, is_system)
    select v_conv_id, v_seller_id, '네, 가능합니다. 약속 잡기로 시간 맞춰요!', false
    where not exists (
      select 1 from public.trade_messages m
      where m.conversation_id = v_conv_id and m.body like '네, 가능합니다%'
    );

    insert into public.trade_appointments (
      conversation_id, trade_method, scheduled_at, location,
      status, proposed_by
    )
    select
      v_conv_id,
      'meet',
      now() + interval '2 days',
      '역삼역 2번 출구 앞',
      'pending',
      v_buyer_id
    where not exists (
      select 1 from public.trade_appointments a
      where a.conversation_id = v_conv_id and a.status in ('pending', 'confirmed')
    );
  else
    raise notice '채팅 시드는 계정이 2개일 때만 생성됩니다. (현재 판매자 1명)';
  end if;

  raise notice '시드 완료. 판매자 ID: %', v_seller_id;
end $$;
