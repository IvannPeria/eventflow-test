-- Run this in the Supabase SQL editor.
-- Allows anonymous/public inserts for the hiring request form.
-- If you want stricter access, replace anon with authenticated and add auth checks.

alter table public.events enable row level security;
alter table public.clients enable row level security;
alter table public.event_clients enable row level security;
alter table public.system_activation enable row level security;

-- Optional: allow reading back rows for the browser test endpoint.
drop policy if exists "events_select_public" on public.events;
drop policy if exists "clients_select_public" on public.clients;
drop policy if exists "event_clients_select_public" on public.event_clients;
drop policy if exists "system_activation_select_public" on public.system_activation;

create policy "events_select_public"
  on public.events
  for select
  to anon
  using (true);

create policy "clients_select_public"
  on public.clients
  for select
  to anon
  using (true);

create policy "event_clients_select_public"
  on public.event_clients
  for select
  to anon
  using (true);

create policy "system_activation_select_public"
  on public.system_activation
  for select
  to anon
  using (true);

drop policy if exists "events_insert_public" on public.events;
drop policy if exists "clients_insert_public" on public.clients;
drop policy if exists "event_clients_insert_public" on public.event_clients;
drop policy if exists "system_activation_insert_public" on public.system_activation;

create policy "events_insert_public"
  on public.events
  for insert
  to anon
  with check (true);

create policy "clients_insert_public"
  on public.clients
  for insert
  to anon
  with check (true);

create policy "event_clients_insert_public"
  on public.event_clients
  for insert
  to anon
  with check (true);

create policy "system_activation_insert_public"
  on public.system_activation
  for insert
  to anon
  with check (true);
