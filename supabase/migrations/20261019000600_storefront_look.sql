-- Storefront refresh ("paper happiness" look): horizontal header logo, hero headline style,
-- "View all" links and section headings. Only touches values still at their seeded defaults,
-- so anything the owner has already edited is left alone.

update public.site_settings
set value = to_jsonb('/brand/paperica-logo-horizontal.png'::text)
where key = 'logo_url' and value = to_jsonb('/brand/paperica-logo-trim.png'::text);

update public.homepage_sections
set config = config || '{"heading_font": "playful", "text_tone": "dark"}'::jsonb
where type = 'hero' and coalesce(config->>'heading_font', 'script') = 'script' and not config ? 'text_tone';

update public.homepage_sections
set config = config || '{"heading": "Shop by Collection", "view_all_url": "/collections/new-in"}'::jsonb
where type = 'collection_carousel' and config->>'heading' = 'Shop By Collection' and not config ? 'view_all_url';

update public.homepage_sections
set config = config || '{"heading": "The New Collection", "view_all_url": "/collections/new-in/new-collection"}'::jsonb
where type = 'product_mosaic' and not config ? 'heading';
