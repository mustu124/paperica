-- Listing pages: optional descriptions for collection headers/SEO, and price-on-enquiry
-- for WhatsApp-mode (customisable) products.

alter table public.categories    add column if not exists description text;
alter table public.subcategories add column if not exists description text;

-- Customisable products may show "Enquire for price"; buy-mode products always need a price.
alter table public.products alter column price_inr drop not null;
alter table public.products drop constraint if exists products_price_required_for_buy;
alter table public.products
  add constraint products_price_required_for_buy
  check (mode = 'whatsapp' or price_inr is not null);
