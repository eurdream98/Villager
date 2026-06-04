-- 개발용 고정 구매자·판매자 + 거래 더미 (schema.sql 적용 후 1회 실행)
--
-- 계정 (이메일 / 비밀번호)
--   구매자: buyer@villager.dev  / villager-dev-buyer
--   판매자: seller@villager.dev / villager-dev-seller
--
-- 사전 조건
--   1. schema.sql (+ escrow-migration.sql) 적용
--   2. Supabase → Authentication → Providers → Email 활성화
--   3. 앱 로그인 화면 → 「데모 구매자로 로그인」

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Auth 사용자 (고정 UUID)
-- ---------------------------------------------------------------------------
create or replace function public.dev_upsert_auth_user(
  p_id uuid,
  p_email text,
  p_password text,
  p_display_name text
) returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_display_name, 'full_name', p_display_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = now(),
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    p_id,
    p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider_id, provider) do update set
    identity_data = excluded.identity_data,
    updated_at = now();
end;
$$;

do $$
declare
  v_buyer_id uuid := 'd1111111-1111-1111-1111-111111111111';
  v_seller_id uuid := 'd2222222-2222-2222-2222-222222222222';
  v_listing1 uuid := 'b1111111-1111-1111-1111-111111111111';
  v_listing2 uuid := 'b2222222-2222-2222-2222-222222222222';
  v_conv_id uuid := 'c1111111-1111-1111-1111-111111111111';
  v_apt_id uuid := 'a1111111-1111-1111-1111-111111111111';
  v_order_id uuid := 'e1111111-1111-1111-1111-111111111111';
begin
  perform public.dev_upsert_auth_user(
    v_buyer_id, 'buyer@villager.dev', 'villager-dev-buyer', '데모 구매자');
  perform public.dev_upsert_auth_user(
    v_seller_id, 'seller@villager.dev', 'villager-dev-seller', '데모 판매자');

  insert into public.neighborhoods (id, name, slug, map_x, map_y)
  values
    ('a1111111-1111-1111-1111-111111111111', '역삼동', 'yeoksam', 62, 38)
  on conflict (slug) do update set
    name = excluded.name,
    map_x = excluded.map_x,
    map_y = excluded.map_y;

  insert into public.profiles (id, display_name, email, provider, neighborhood_id)
  values
    (
      v_buyer_id,
      '데모 구매자',
      'buyer@villager.dev',
      'email',
      'a1111111-1111-1111-1111-111111111111'
    ),
    (
      v_seller_id,
      '데모 판매자',
      'seller@villager.dev',
      'email',
      'a1111111-1111-1111-1111-111111111111'
    )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    neighborhood_id = excluded.neighborhood_id;

  insert into public.member_growth (user_id, total_xp)
  values
    (v_buyer_id, 240),
    (v_seller_id, 520)
  on conflict (user_id) do update set
    total_xp = excluded.total_xp,
    updated_at = now();

  insert into public.trade_listings (
    id, seller_id, neighborhood, title, description, price, is_free, status
  )
  values
    (
      v_listing1,
      v_seller_id,
      '역삼동',
      '아이패드 미니 6세대 64GB',
      '데모 구매자용 — 택배·에스크로 테스트 상품입니다.',
      320000,
      false,
      'active'
    ),
    (
      v_listing2,
      v_seller_id,
      '역삼동',
      '무선 키보드 (로지텍)',
      '나눔 상품 (에스크로 없음).',
      0,
      true,
      'active'
    )
  on conflict (id) do update set
    seller_id = excluded.seller_id,
    title = excluded.title,
    description = excluded.description,
    price = excluded.price,
    is_free = excluded.is_free,
    updated_at = now();

  delete from public.trade_listing_images
  where listing_id in (v_listing1, v_listing2) and storage_path like 'seed/dev/%';

  insert into public.trade_listing_images (listing_id, storage_path, public_url, sort_order)
  values
    (v_listing1, 'seed/dev/ipad', 'https://picsum.photos/seed/villager-dev-ipad/800/600', 0),
    (v_listing2, 'seed/dev/kb', 'https://picsum.photos/seed/villager-dev-kb/800/600', 0);

  delete from public.trade_orders
  where conversation_id = v_conv_id
    or conversation_id in (
      select id from public.trade_conversations
      where listing_id = v_listing1 and buyer_id = v_buyer_id
    );

  delete from public.trade_appointments
  where conversation_id = v_conv_id
    or conversation_id in (
      select id from public.trade_conversations
      where listing_id = v_listing1 and buyer_id = v_buyer_id
    );

  delete from public.trade_messages
  where conversation_id = v_conv_id
    or conversation_id in (
      select id from public.trade_conversations
      where listing_id = v_listing1 and buyer_id = v_buyer_id
    );

  delete from public.trade_conversations
  where id = v_conv_id
    or (listing_id = v_listing1 and buyer_id = v_buyer_id);

  insert into public.trade_conversations (id, listing_id, buyer_id, seller_id)
  values (v_conv_id, v_listing1, v_buyer_id, v_seller_id);

  insert into public.trade_messages (conversation_id, sender_id, body, is_system)
  values
    (v_conv_id, v_buyer_id, '안녕하세요! 택배로 구매하고 싶어요.', false),
    (v_conv_id, v_seller_id, '네, 약속 확정 후 결제해 주시면 됩니다.', false);

  insert into public.trade_appointments (
    id, conversation_id, trade_method, scheduled_at, location,
    status, proposed_by, confirmed_by
  )
  values (
    v_apt_id,
    v_conv_id,
    'shipping',
    now() + interval '3 days',
    '서울 강남구 (택배 수령)',
    'confirmed',
    v_buyer_id,
    v_seller_id
  )
  on conflict (id) do update set
    status = 'confirmed',
    trade_method = 'shipping',
    confirmed_by = v_seller_id,
    updated_at = now();

  insert into public.trade_orders (
    id, conversation_id, listing_id, buyer_id, seller_id, appointment_id,
    trade_method, amount, escrow_status, payment_deadline_at
  )
  values (
    v_order_id,
    v_conv_id,
    v_listing1,
    v_buyer_id,
    v_seller_id,
    v_apt_id,
    'shipping',
    320000,
    'pending_payment',
    now() + interval '48 hours'
  )
  on conflict (id) do update set
    conversation_id = excluded.conversation_id,
    appointment_id = excluded.appointment_id,
    escrow_status = excluded.escrow_status,
    amount = excluded.amount,
    payment_deadline_at = excluded.payment_deadline_at,
    updated_at = now();

  raise notice '데모 시드 완료. 구매자: buyer@villager.dev / villager-dev-buyer';
end $$;

drop function if exists public.dev_upsert_auth_user(uuid, text, text, text);
