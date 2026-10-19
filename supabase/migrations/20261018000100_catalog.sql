-- Catalogue: categories, subcategories, products and their images, variants and placements.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admins may manage the admins table itself (the proxy check uses the
-- "admins can read own row" policy from the previous migration).
drop policy if exists "admins full access" on public.admins;
create policy "admins full access"
  on public.admins for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Explicit grants (don't rely on Supabase's default privileges); RLS still applies.
revoke all on public.admins from anon;
grant select, insert, update, delete on public.admins to authenticated;

-- ---------------------------------------------------------------------------
-- Categories (the 6 top-level menu heads)
-- ---------------------------------------------------------------------------

create table public.categories (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  sort_order          int  not null default 0,
  show_in_menu        boolean not null default true,
  image_url           text,
  -- [{ "url": "...", "alt": "...", "label": "...", "link_url": "..." }] shown in the mega-menu
  menu_feature_images jsonb not null default '[]'::jsonb,
  -- Mode new products in this category default to. 'whatsapp' categories (PERSONALISED)
  -- also force every linked product into WhatsApp mode (see triggers below).
  default_mode        text not null default 'buy' check (default_mode in ('buy', 'whatsapp')),
  check (jsonb_typeof(menu_feature_images) = 'array')
);

-- ---------------------------------------------------------------------------
-- Subcategories
-- kind decides how the listing is built:
--   view_all             every product shown in the category's other subcategories
--   manual               products linked through product_subcategories
--   filter_new           products where is_new
--   filter_best          products where is_best_seller
--   filter_under_1000    products in this category priced under ₹1,000
--   filter_personalised  WhatsApp-mode products in this category
--   content_page         CMS page (pages.slug = subcategory slug) plus any linked products
-- ---------------------------------------------------------------------------

create table public.subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  int  not null default 0,
  kind        text not null default 'manual' check (kind in (
                'view_all', 'manual', 'filter_new', 'filter_best',
                'filter_under_1000', 'filter_personalised', 'content_page'
              )),
  unique (category_id, slug)
);

create index subcategories_category_id_idx on public.subcategories (category_id);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text not null,
  short_description    text,
  description_html     text,
  price_inr            numeric(10, 2) not null check (price_inr >= 0),
  compare_at_price_inr numeric(10, 2) check (compare_at_price_inr is null or compare_at_price_inr >= 0),
  sku                  text unique,
  stock_qty            int check (stock_qty is null or stock_qty >= 0),
  track_stock          boolean not null default false,
  mode                 text not null default 'buy' check (mode in ('buy', 'whatsapp')),
  badge_text           text,
  is_new               boolean not null default false,
  is_best_seller       boolean not null default false,
  low_stock_message    text,
  is_active            boolean not null default true,
  sort_order           int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- The unique constraint creates the products(slug) index used by product page lookups.
  constraint products_slug_key unique (slug)
);

create index products_active_sort_idx on public.products (is_active, sort_order);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  sort_order int  not null default 0
);

create index product_images_product_id_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  label          text not null,                 -- e.g. "Blush Pink"
  option_group   text not null default 'Option', -- e.g. "Colour", "Ruling"
  price_override numeric(10, 2) check (price_override is null or price_override >= 0),
  stock_qty      int check (stock_qty is null or stock_qty >= 0),
  sort_order     int not null default 0
);

create index product_variants_product_id_idx on public.product_variants (product_id, sort_order);

create table public.product_subcategories (
  product_id     uuid not null references public.products (id) on delete cascade,
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  primary key (product_id, subcategory_id)
);

create index product_subcategories_subcategory_id_idx
  on public.product_subcategories (subcategory_id);

-- ---------------------------------------------------------------------------
-- WhatsApp-mode enforcement for 'whatsapp' categories (PERSONALISED)
-- ---------------------------------------------------------------------------

-- Linking a product into a whatsapp category switches it to WhatsApp mode.
create or replace function public.enforce_whatsapp_on_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.subcategories s
    join public.categories c on c.id = s.category_id
    where s.id = new.subcategory_id and c.default_mode = 'whatsapp'
  ) then
    update public.products set mode = 'whatsapp'
    where id = new.product_id and mode <> 'whatsapp';
  end if;
  return new;
end;
$$;

create trigger product_subcategories_enforce_whatsapp
  after insert or update on public.product_subcategories
  for each row execute function public.enforce_whatsapp_on_link();

-- A product placed in a whatsapp category cannot be switched back to 'buy'.
create or replace function public.prevent_buy_mode_in_whatsapp_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.mode = 'buy' and exists (
    select 1
    from public.product_subcategories ps
    join public.subcategories s on s.id = ps.subcategory_id
    join public.categories c on c.id = s.category_id
    where ps.product_id = new.id and c.default_mode = 'whatsapp'
  ) then
    raise exception 'Products in a personalised category must use WhatsApp mode.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger products_prevent_buy_mode
  before update of mode on public.products
  for each row execute function public.prevent_buy_mode_in_whatsapp_category();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.categories            enable row level security;
alter table public.subcategories         enable row level security;
alter table public.products              enable row level security;
alter table public.product_images        enable row level security;
alter table public.product_variants      enable row level security;
alter table public.product_subcategories enable row level security;

-- Public reads
create policy "public read categories"
  on public.categories for select to anon, authenticated using (true);

create policy "public read subcategories"
  on public.subcategories for select to anon, authenticated using (true);

create policy "public read active products"
  on public.products for select to anon, authenticated using (is_active);

create policy "public read images of active products"
  on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));

create policy "public read variants of active products"
  on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));

create policy "public read placements of active products"
  on public.product_subcategories for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));

-- Admin full access (policies are OR-ed, so admins also see inactive products)
create policy "admins full access" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.subcategories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.product_subcategories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on
  public.categories, public.subcategories, public.products,
  public.product_images, public.product_variants, public.product_subcategories
  to anon, authenticated;
grant insert, update, delete on
  public.categories, public.subcategories, public.products,
  public.product_images, public.product_variants, public.product_subcategories
  to authenticated;
