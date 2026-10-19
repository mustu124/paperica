-- Product page: a separate "Details & Specifications" section (size, pages, paper, binding...).
alter table public.products add column if not exists details_html text;
