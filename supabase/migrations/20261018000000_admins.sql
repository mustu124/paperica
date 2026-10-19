-- Admin users. The only login in the app is the private /admin panel;
-- a Supabase Auth user is an admin only if they have a row here.

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A signed-in user may read only their own row (used by proxy.ts to check admin status).
-- No insert/update/delete policies: admins are added via SQL or the service role only.
drop policy if exists "admins can read own row" on public.admins;
create policy "admins can read own row"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- Helper for RLS policies on other tables: `using (public.is_admin())`.
-- security definer so it can read admins regardless of the caller's RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
