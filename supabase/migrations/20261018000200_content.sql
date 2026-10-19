-- Editable site content: settings, CMS pages, FAQs and homepage sections.

-- Key/value settings (contact details, shipping fee, timelines, copy...).
-- Values are jsonb so numbers, booleans, strings and null keep their type.
create table public.site_settings (
  key        text primary key,
  value      jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- CMS pages: policies, corporate gifting, custom orders, contact and help-centre intros.
-- body_html may contain {{tokens}} (e.g. {{contact_email}}) that are replaced with
-- site_settings values at render time.
create table public.pages (
  slug       text primary key,
  title      text not null,
  body_html  text not null default '',
  updated_at timestamptz not null default now()
);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

create table public.faqs (
  id          uuid primary key default gen_random_uuid(),
  group_name  text not null,
  question    text not null,
  answer_html text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create index faqs_group_sort_idx on public.faqs (sort_order);

create table public.homepage_sections (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in (
               'hero', 'collection_carousel', 'promo_duo', 'product_mosaic',
               'promo_trio', 'instagram_feed', 'info_strip'
             )),
  sort_order int not null default 0,
  is_active  boolean not null default true,
  config     jsonb not null default '{}'::jsonb
);

create index homepage_sections_sort_idx on public.homepage_sections (sort_order);

create table public.homepage_assets (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references public.homepage_sections (id) on delete cascade,
  slot         int not null default 0,   -- position within the section (e.g. promo_duo left = 0, right = 1)
  image_url    text,
  image_alt    text not null default '',
  link_url     text,
  heading      text,
  subheading   text,
  button_label text,
  badge_text   text,
  sort_order   int not null default 0    -- order within a slot (e.g. images that rotate in one tile)
);

create index homepage_assets_section_idx on public.homepage_assets (section_id, slot, sort_order);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.site_settings     enable row level security;
alter table public.pages             enable row level security;
alter table public.faqs              enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.homepage_assets   enable row level security;

create policy "public read settings"
  on public.site_settings for select to anon, authenticated using (true);

create policy "public read pages"
  on public.pages for select to anon, authenticated using (true);

create policy "public read active faqs"
  on public.faqs for select to anon, authenticated using (is_active);

create policy "public read active homepage sections"
  on public.homepage_sections for select to anon, authenticated using (is_active);

create policy "public read assets of active sections"
  on public.homepage_assets for select to anon, authenticated
  using (exists (
    select 1 from public.homepage_sections s where s.id = section_id and s.is_active
  ));

create policy "admins full access" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.faqs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.homepage_sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.homepage_assets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on
  public.site_settings, public.pages, public.faqs,
  public.homepage_sections, public.homepage_assets
  to anon, authenticated;
grant insert, update, delete on
  public.site_settings, public.pages, public.faqs,
  public.homepage_sections, public.homepage_assets
  to authenticated;
