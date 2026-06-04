-- Storage: trade-listings (판매 사진)
-- SQL Editor에서 1회 실행. Dashboard에서 버킷을 이미 만들었다면 policy 만 적용됩니다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trade-listings',
  'trade-listings',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "trade_listings_storage_select" on storage.objects;
drop policy if exists "trade_listings_storage_insert" on storage.objects;
drop policy if exists "trade_listings_storage_update" on storage.objects;
drop policy if exists "trade_listings_storage_delete" on storage.objects;

create policy "trade_listings_storage_select"
  on storage.objects for select
  using (bucket_id = 'trade-listings');

create policy "trade_listings_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trade-listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "trade_listings_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'trade-listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "trade_listings_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trade-listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
