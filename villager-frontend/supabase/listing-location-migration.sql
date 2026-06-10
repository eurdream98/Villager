-- 상품 등록 위치(지도핀+텍스트 동네명 병행)

alter table public.trade_listings
 add column if not exists latitude double precision,
 add column if not exists longitude double precision,
 add column if not exists address text;

comment on column public.trade_listings.latitude is '판매 희망 위치 위도 (지도 핀)';
comment on column public.trade_listings.longitude is '판매 희망 위치 경도 (지도 핀)';
comment on column public.trade_listings.address is '지도 역지오코딩 주소 또는 사용자 입력 동네명';
