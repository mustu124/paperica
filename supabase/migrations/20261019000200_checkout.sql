-- Guest checkout: variant snapshot on order items, a private access token for the
-- confirmation page, atomic "mark paid + decrement stock", and a rate limiter.
-- Everything here is called only from server code with the service-role key.

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete set null;

-- Secret token so only the buyer's browser can open /order-confirmation (order numbers are sequential).
alter table public.orders
  add column if not exists access_token uuid not null default gen_random_uuid();

create index if not exists orders_razorpay_order_id_idx on public.orders (razorpay_order_id);

-- ---------------------------------------------------------------------------
-- mark_order_paid: pending/failed → paid exactly once, decrementing stock in the same
-- transaction. Returns true only for the call that made the transition, so the browser
-- verify step and the webhook can both call it safely.
-- ---------------------------------------------------------------------------
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated int;
  item record;
begin
  update public.orders
     set payment_status = 'paid',
         razorpay_payment_id = coalesce(p_payment_id, razorpay_payment_id)
   where id = p_order_id
     and payment_status in ('pending', 'failed');
  get diagnostics updated = row_count;
  if updated = 0 then
    return false; -- already paid (or refunded): nothing to do
  end if;

  for item in
    select oi.product_id, oi.variant_id, oi.qty
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id is not null
  loop
    -- Variant stock when the variant tracks its own quantity, otherwise product stock.
    -- Never below zero: the payment is already taken, so an oversell is flagged for the
    -- admin rather than failing the order.
    if item.variant_id is not null and exists (
      select 1 from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = item.variant_id and p.track_stock and v.stock_qty is not null
    ) then
      update public.product_variants
         set stock_qty = greatest(stock_qty - item.qty, 0)
       where id = item.variant_id;
    else
      update public.products
         set stock_qty = greatest(coalesce(stock_qty, 0) - item.qty, 0)
       where id = item.product_id and track_stock;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Fixed-window rate limiter shared by all serverless instances.
-- check_rate_limit('checkout:1.2.3.4', 10, 600) → true while under 10 hits per 10 minutes.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         int not null default 0
);

alter table public.rate_limits enable row level security; -- no policies: service role only
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
                 when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
                 else r.hits + 1
               end,
        window_start = case
                 when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
                 else r.window_start
               end
  returning hits into current_hits;

  -- Opportunistic cleanup of stale keys.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return current_hits <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
