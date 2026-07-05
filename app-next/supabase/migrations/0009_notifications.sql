-- HotelOS Platform — Phase 9: in-app admin notifications + realtime
-- An org-scoped notification feed surfaced in the admin panel. Rows are created
-- whenever a booking is created / updated / cancelled (from the public site or
-- the admin panel) and streamed to staff in real time via Supabase Realtime.
-- Multi-tenant by organization_id. Idempotent.

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null default 'booking',
  title text not null,
  body text,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_org
  on notifications(organization_id, created_at desc);
create index if not exists idx_notifications_unread
  on notifications(organization_id) where read = false;

-- ----------------------------------------------------------------------------
-- RLS — any active member of the org reads and updates the org's notifications.
-- Inserts come from privileged server code (service-role) and from members.
-- ----------------------------------------------------------------------------
alter table notifications enable row level security;
alter table notifications force row level security;

drop policy if exists "notifications member read" on notifications;
create policy "notifications member read" on notifications for select
  using (is_org_member(organization_id));

drop policy if exists "notifications member update" on notifications;
create policy "notifications member update" on notifications for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop policy if exists "notifications member insert" on notifications;
create policy "notifications member insert" on notifications for insert
  with check (is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- Realtime — stream inserts/updates for the live admin feed and boards.
-- Full replica identity so UPDATE payloads carry the whole row (for RLS).
-- ----------------------------------------------------------------------------
alter table notifications replica identity full;
alter table reservations  replica identity full;
alter table guests        replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table notifications;
exception when duplicate_object then null; end $$;

do $$
begin
  alter publication supabase_realtime add table reservations;
exception when duplicate_object then null; end $$;

do $$
begin
  alter publication supabase_realtime add table guests;
exception when duplicate_object then null; end $$;
