-- Branding: logo / footer logo / link-preview image are editable in Admin → Site Settings
-- and uploaded into a new "branding" folder of the media bucket.

drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_admin()
    and (storage.foldername(name))[1] in ('products', 'homepage', 'categories', 'pages', 'branding')
  );

drop policy if exists "admins update media" on storage.objects;
create policy "admins update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (
    bucket_id = 'media'
    and public.is_admin()
    and (storage.foldername(name))[1] in ('products', 'homepage', 'categories', 'pages', 'branding')
  );

-- Default link-preview (OpenGraph) image, 1200×630, bundled in /public/brand.
insert into public.site_settings (key, value)
values ('og_image_url', to_jsonb('/brand/paperica-og.jpg'::text))
on conflict (key) do nothing;

-- The footer now shows the logo instead of the chilli illustration (only if never changed).
update public.site_settings
set value = to_jsonb('/brand/paperica-logo-trim.png'::text)
where key = 'footer_illustration_url' and value = to_jsonb('/brand/paperica-chilli.png'::text);
