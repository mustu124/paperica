-- Personalised / corporate enquiries.

-- Content pages can carry their own "Enquire on WhatsApp" message and "Email us" subject
-- (Corporate Gifting, Custom Orders). Both are editable in the admin.
alter table public.pages add column if not exists cta_whatsapp_message text;
alter table public.pages add column if not exists cta_email_subject text;

-- Contact-form enquiries (Customer Support, Corporate Gifting short form, ...).
-- Written only by server code (service role); readable/manageable by admins.
create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  enquiry_type text not null check (enquiry_type in ('customer_support', 'personalised_orders', 'corporate_gifting')),
  name         text not null,
  email        text not null,
  phone        text,
  order_number text,
  message      text not null,
  details      jsonb not null default '{}'::jsonb, -- corporate fields: company, quantity, budget, ...
  status       text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at   timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);

alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon;

create policy "admins full access" on public.enquiries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.enquiries to authenticated;
