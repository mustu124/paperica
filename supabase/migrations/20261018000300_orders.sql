-- Orders, order items and the Razorpay webhook idempotency log.
-- Storefront writes happen only in server code with the service-role key (which bypasses RLS).
-- No anon policies exist on these tables, so the public can neither read nor write them.

create sequence public.order_number_seq start with 1 increment by 1;

-- Sequential, human-friendly order numbers: PPR-000001, PPR-000002, ...
create or replace function public.next_order_number()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'PPR-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
$$;

revoke all on function public.next_order_number() from public, anon, authenticated;
grant execute on function public.next_order_number() to service_role;
grant usage on sequence public.order_number_seq to service_role;

create table public.orders (
  id                     uuid primary key default gen_random_uuid(),
  -- The unique constraint creates the orders(order_number) index.
  order_number           text not null default public.next_order_number(),
  customer_name          text not null,
  customer_email         text not null,
  customer_phone         text not null,
  shipping_address_line1 text not null,
  shipping_address_line2 text,
  city                   text not null,
  state                  text not null,
  pincode                text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  notes                  text,
  subtotal_inr           numeric(10, 2) not null check (subtotal_inr >= 0),
  shipping_inr           numeric(10, 2) not null default 0 check (shipping_inr >= 0),
  total_inr              numeric(10, 2) not null check (total_inr >= 0),
  razorpay_order_id      text unique,
  razorpay_payment_id    text,
  payment_status         text not null default 'pending'
                           check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  dispatch_status        text not null default 'processing'
                           check (dispatch_status in ('processing', 'dispatched', 'delivered', 'cancelled')),
  tracking_details       text,
  courier_name           text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint orders_order_number_key unique (order_number)
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_payment_status_idx on public.orders (payment_status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Snapshot of what was bought, so later product edits don't change past orders.
create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  product_name   text not null,
  variant_label  text,
  unit_price_inr numeric(10, 2) not null check (unit_price_inr >= 0),
  qty            int not null check (qty > 0),
  image_url      text
);

create index order_items_order_id_idx on public.order_items (order_id);

create table public.razorpay_events (
  id         uuid primary key default gen_random_uuid(),
  event_id   text not null unique,   -- x-razorpay-event-id header
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security: admins only (plus the service role, which bypasses RLS)
-- ---------------------------------------------------------------------------

alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.razorpay_events enable row level security;

create policy "admins full access" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins full access" on public.razorpay_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.orders, public.order_items, public.razorpay_events from anon;
grant select, insert, update, delete on
  public.orders, public.order_items, public.razorpay_events
  to authenticated;
