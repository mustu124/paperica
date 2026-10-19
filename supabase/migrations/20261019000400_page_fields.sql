-- Content pages: an explicit "Last updated" date for legal pages (not the auto updated_at,
-- which changes on any edit) and a label for the page's main enquiry button.
alter table public.pages add column if not exists effective_date date;
alter table public.pages add column if not exists cta_label text;
