-- Separate phone images for the homepage: each homepage image can have an optional mobile
-- version (art direction). Phones show it when set; otherwise the laptop image is used.
alter table public.homepage_assets add column if not exists mobile_image_url text;
