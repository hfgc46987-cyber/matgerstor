-- =============================================================
-- StoreCraft — Migration 004: Storage buckets & policies
--
-- Buckets:
--   store-assets   -> stores/{store_id}/branding/*  (logo, banner, favicon)
--                     stores/{store_id}/categories/*
--   product-images -> stores/{store_id}/products/{product_id}/*
--
-- Both buckets are public for reads (the storefront must show
-- images to anonymous visitors). Writes are restricted to
-- authenticated members of the store encoded in the object path,
-- so no store can touch another store's files.
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('store-assets', 'store-assets', true, 5242880, null),
  ('product-images', 'product-images', true, 10485760, null)
on conflict (id) do nothing;

-- Helper: extract the store_id from a path "stores/{store_id}/..." 
create or replace function public.storage_store_id(p_path text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select nullif(split_part(p_path, '/', 2), '')::uuid;
$$;

-- ---------- store-assets ----------
create policy "store_assets_public_read" on storage.objects
  for select using (bucket_id = 'store-assets');

create policy "store_assets_member_write" on storage.objects
  for insert with check (
    bucket_id = 'store-assets'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.store_members sm
      where sm.store_id = public.storage_store_id(name)
        and sm.user_id = auth.uid()
    )
  );

create policy "store_assets_member_update" on storage.objects
  for update using (
    bucket_id = 'store-assets'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.store_members sm
      where sm.store_id = public.storage_store_id(name)
        and sm.user_id = auth.uid()
    )
  );

create policy "store_assets_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'store-assets'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.store_members sm
      where sm.store_id = public.storage_store_id(name)
        and sm.user_id = auth.uid()
        and sm.role in ('owner', 'admin')
    )
  );

-- ---------- product-images ----------
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_member_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.store_members sm
      where sm.store_id = public.storage_store_id(name)
        and sm.user_id = auth.uid()
    )
  );

create policy "product_images_member_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.store_members sm
      where sm.store_id = public.storage_store_id(name)
        and sm.user_id = auth.uid()
    )
  );

create policy "product_images_member_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.store_members sm
      where sm.store_id = public.storage_store_id(name)
        and sm.user_id = auth.uid()
    )
  );
