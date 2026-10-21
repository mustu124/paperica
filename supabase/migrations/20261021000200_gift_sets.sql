-- Gift sets (Catalogue V3 §5): a gift set is a normal product whose contents are listed in
-- product_bundle_items ("1 notepad" = any product in Paper Edit → Notepads). Its stock is
-- worked out in the database, so listings, the cart and checkout need nothing special:
--
--   sets available = lowest, over its contents, of
--                    (units of that kind in stock − units held for paid, not-yet-dispatched
--                     gift-set orders) ÷ units per set
--
-- The customer chooses designs on WhatsApp after ordering, so component stock is reduced by
-- the owner when packing (until then the paid order holds the units back).
-- Also: an optional note at the bottom of a collection page (subcategories.footer_note).

create table if not exists public.product_bundle_items (
  id             uuid primary key default gen_random_uuid(),
  bundle_id      uuid not null references public.products (id) on delete cascade,
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  label          text not null,
  qty            int not null default 1 check (qty between 1 and 99),
  sort_order     int not null default 0
);

create index if not exists product_bundle_items_bundle_idx on public.product_bundle_items (bundle_id, sort_order);
create index if not exists product_bundle_items_subcategory_idx on public.product_bundle_items (subcategory_id);

alter table public.product_bundle_items enable row level security;
drop policy if exists "admins full access" on public.product_bundle_items;
create policy "admins full access" on public.product_bundle_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.product_bundle_items from anon;
grant select, insert, update, delete on public.product_bundle_items to authenticated;

alter table public.subcategories add column if not exists footer_note text;

-- ---------------------------------------------------------------------------
-- Stock of every gift set, recalculated from its contents.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_bundle_stock()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  with pools as (
    -- Units in stock per kind of item (gift sets themselves never count as contents).
    -- Untracked products count as plenty.
    select bi.subcategory_id,
           coalesce(sum(case when p.track_stock then coalesce(p.stock_qty, 0) else 100000 end), 0) as units
    from (select distinct subcategory_id from public.product_bundle_items) bi
    left join public.product_subcategories ps on ps.subcategory_id = bi.subcategory_id
    left join public.products p
           on p.id = ps.product_id
          and not exists (select 1 from public.product_bundle_items x where x.bundle_id = p.id)
    group by bi.subcategory_id
  ),
  held as (
    -- Units promised to paid gift-set orders that haven't been dispatched yet.
    select bi.subcategory_id, sum(oi.qty * bi.qty) as units
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.product_bundle_items bi on bi.bundle_id = oi.product_id
    where o.payment_status = 'paid' and o.dispatch_status = 'processing'
    group by bi.subcategory_id
  ),
  sets as (
    select bi.bundle_id,
           min(floor(greatest(coalesce(pl.units, 0) - coalesce(h.units, 0), 0) / bi.qty))::int as available
    from public.product_bundle_items bi
    left join pools pl on pl.subcategory_id = bi.subcategory_id
    left join held h on h.subcategory_id = bi.subcategory_id
    group by bi.bundle_id
  )
  update public.products p
     set track_stock = true,
         stock_qty = s.available
    from sets s
   where p.id = s.bundle_id
     and (p.stock_qty is distinct from s.available or not p.track_stock);
end;
$$;

revoke all on function public.refresh_bundle_stock() from public, anon, authenticated;

-- Statement-level triggers; the depth check stops the function's own update re-triggering it.
create or replace function public.refresh_bundle_stock_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() = 1 then
    perform public.refresh_bundle_stock();
  end if;
  return null;
end;
$$;

revoke all on function public.refresh_bundle_stock_trigger() from public, anon, authenticated;

drop trigger if exists refresh_bundle_stock on public.products;
create trigger refresh_bundle_stock
  after insert or update or delete on public.products
  for each statement execute function public.refresh_bundle_stock_trigger();

drop trigger if exists refresh_bundle_stock on public.product_subcategories;
create trigger refresh_bundle_stock
  after insert or update or delete on public.product_subcategories
  for each statement execute function public.refresh_bundle_stock_trigger();

drop trigger if exists refresh_bundle_stock on public.product_bundle_items;
create trigger refresh_bundle_stock
  after insert or update or delete on public.product_bundle_items
  for each statement execute function public.refresh_bundle_stock_trigger();

drop trigger if exists refresh_bundle_stock on public.orders;
create trigger refresh_bundle_stock
  after update or delete on public.orders
  for each statement execute function public.refresh_bundle_stock_trigger();
