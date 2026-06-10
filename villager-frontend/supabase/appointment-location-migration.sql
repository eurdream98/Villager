-- 약속 장소 (지도 핀 + 텍스트 병행)
alter table public.trade_appointments
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision,
  add column if not exists address   text;

comment on column public.trade_appointments.latitude  is '약속 장소 위도 (지도 핀)';
comment on column public.trade_appointments.longitude is '약속 장소 경도 (지도 핀)';
comment on column public.trade_appointments.address   is '역지오코딩 주소';
comment on column public.trade_appointments.location  is '채팅·요약용 한 줄 장소';
