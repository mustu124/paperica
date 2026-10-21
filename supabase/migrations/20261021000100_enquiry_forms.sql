-- Guided enquiry forms on Custom Orders and Corporate Gifting (choices and indicative prices,
-- edited in Admin → Pages & FAQs), and the original round Paperica logo in the header.
-- Only touches values still at their seeded defaults, so the owner's edits are left alone.

alter table public.pages add column if not exists form_config jsonb not null default '{}'::jsonb;

update public.site_settings
set value = to_jsonb('/brand/paperica-logo-trim.png'::text)
where key = 'logo_url' and value = to_jsonb('/brand/paperica-logo-horizontal.png'::text);
