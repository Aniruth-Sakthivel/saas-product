-- HotelOS — Row Level Security
-- Authorization is driven by membership lookups. App-layer RBAC mirrors these.
-- Idempotent: each policy is dropped if present before being (re)created.

-- ----------------------------------------------------------------------------
-- Helper functions (security definer to avoid recursive RLS on memberships)
-- ----------------------------------------------------------------------------
create or replace function is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.organization_id = org
      and m.profile_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function has_org_role(org uuid, roles user_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.organization_id = org
      and m.profile_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role = any(roles)
  );
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------
alter table profiles            enable row level security;
alter table organizations       enable row level security;
alter table memberships         enable row level security;
alter table room_types          enable row level security;
alter table rooms               enable row level security;
alter table guests              enable row level security;
alter table reservations        enable row level security;
alter table stays               enable row level security;
alter table invoices            enable row level security;
alter table payments            enable row level security;
alter table housekeeping_tasks  enable row level security;
alter table audit_logs          enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
drop policy if exists "profiles self select" on profiles;
create policy "profiles self select" on profiles for select
  using (id = auth.uid());
drop policy if exists "profiles co-member select" on profiles;
create policy "profiles co-member select" on profiles for select
  using (exists (
    select 1 from memberships a join memberships b
      on a.organization_id = b.organization_id
    where a.profile_id = auth.uid() and b.profile_id = profiles.id
  ));
drop policy if exists "profiles self update" on profiles;
create policy "profiles self update" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- organizations
-- ----------------------------------------------------------------------------
drop policy if exists "org member select" on organizations;
create policy "org member select" on organizations for select
  using (is_org_member(id));
drop policy if exists "org insert by creator" on organizations;
create policy "org insert by creator" on organizations for insert
  with check (created_by = auth.uid());
drop policy if exists "org update by admins" on organizations;
create policy "org update by admins" on organizations for update
  using (has_org_role(id, array['OWNER','MANAGER']::user_role[]))
  with check (has_org_role(id, array['OWNER','MANAGER']::user_role[]));
drop policy if exists "org delete by owner" on organizations;
create policy "org delete by owner" on organizations for delete
  using (has_org_role(id, array['OWNER']::user_role[]));

-- ----------------------------------------------------------------------------
-- memberships
-- ----------------------------------------------------------------------------
drop policy if exists "membership self or member select" on memberships;
create policy "membership self or member select" on memberships for select
  using (profile_id = auth.uid() or is_org_member(organization_id));
-- First membership at org creation (creator becomes OWNER) OR admin invites others.
drop policy if exists "membership insert" on memberships;
create policy "membership insert" on memberships for insert
  with check (
    profile_id = auth.uid()
    or has_org_role(organization_id, array['OWNER','MANAGER']::user_role[])
  );
drop policy if exists "membership update by admins" on memberships;
create policy "membership update by admins" on memberships for update
  using (has_org_role(organization_id, array['OWNER','MANAGER']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER']::user_role[]));
drop policy if exists "membership delete by admins" on memberships;
create policy "membership delete by admins" on memberships for delete
  using (has_org_role(organization_id, array['OWNER','MANAGER']::user_role[]));

-- ----------------------------------------------------------------------------
-- Generic per-table policies via macro-like repetition
-- room_types, rooms, guests, reservations, stays, invoices, payments,
-- housekeeping_tasks: any active member reads/writes within their org.
-- Financial tables additionally allow OWNER/MANAGER/ACCOUNTANT writes only.
-- ----------------------------------------------------------------------------

-- room_types
drop policy if exists "room_types member read" on room_types;
create policy "room_types member read" on room_types for select using (is_org_member(organization_id));
drop policy if exists "room_types admin write" on room_types;
create policy "room_types admin write" on room_types for all
  using (has_org_role(organization_id, array['OWNER','MANAGER']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER']::user_role[]));

-- rooms
drop policy if exists "rooms member read" on rooms;
create policy "rooms member read" on rooms for select using (is_org_member(organization_id));
drop policy if exists "rooms staff write" on rooms;
create policy "rooms staff write" on rooms for all
  using (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST','HOUSEKEEPING']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST','HOUSEKEEPING']::user_role[]));

-- guests
drop policy if exists "guests member read" on guests;
create policy "guests member read" on guests for select using (is_org_member(organization_id));
drop policy if exists "guests staff write" on guests;
create policy "guests staff write" on guests for all
  using (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST']::user_role[]));

-- reservations
drop policy if exists "reservations member read" on reservations;
create policy "reservations member read" on reservations for select using (is_org_member(organization_id));
drop policy if exists "reservations staff write" on reservations;
create policy "reservations staff write" on reservations for all
  using (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST']::user_role[]));

-- stays
drop policy if exists "stays member read" on stays;
create policy "stays member read" on stays for select using (is_org_member(organization_id));
drop policy if exists "stays staff write" on stays;
create policy "stays staff write" on stays for all
  using (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER','RECEPTIONIST']::user_role[]));

-- invoices (financial)
drop policy if exists "invoices member read" on invoices;
create policy "invoices member read" on invoices for select using (is_org_member(organization_id));
drop policy if exists "invoices finance write" on invoices;
create policy "invoices finance write" on invoices for all
  using (has_org_role(organization_id, array['OWNER','MANAGER','ACCOUNTANT']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER','ACCOUNTANT']::user_role[]));

-- payments (financial)
drop policy if exists "payments member read" on payments;
create policy "payments member read" on payments for select using (is_org_member(organization_id));
drop policy if exists "payments finance write" on payments;
create policy "payments finance write" on payments for all
  using (has_org_role(organization_id, array['OWNER','MANAGER','ACCOUNTANT','RECEPTIONIST']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER','ACCOUNTANT','RECEPTIONIST']::user_role[]));

-- housekeeping_tasks
drop policy if exists "hk member read" on housekeeping_tasks;
create policy "hk member read" on housekeeping_tasks for select using (is_org_member(organization_id));
drop policy if exists "hk staff write" on housekeeping_tasks;
create policy "hk staff write" on housekeeping_tasks for all
  using (has_org_role(organization_id, array['OWNER','MANAGER','HOUSEKEEPING']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER','MANAGER','HOUSEKEEPING']::user_role[]));

-- audit_logs
drop policy if exists "audit member insert" on audit_logs;
create policy "audit member insert" on audit_logs for insert
  with check (is_org_member(organization_id));
drop policy if exists "audit admin read" on audit_logs;
create policy "audit admin read" on audit_logs for select
  using (has_org_role(organization_id, array['OWNER','MANAGER']::user_role[]));
