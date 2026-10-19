-- Public "media" bucket for product, homepage, category and page images.
-- Anyone can read files via their public URL; only admins can upload, replace or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  -- SVG is excluded on purpose: uploaded SVGs can carry scripts.
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "public read media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

-- Uploads must go into one of the known top-level folders.
create policy "admins upload media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_admin()
    and (storage.foldername(name))[1] in ('products', 'homepage', 'categories', 'pages')
  );

create policy "admins update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (
    bucket_id = 'media'
    and public.is_admin()
    and (storage.foldername(name))[1] in ('products', 'homepage', 'categories', 'pages')
  );

create policy "admins delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
