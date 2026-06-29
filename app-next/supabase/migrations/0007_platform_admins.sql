-- HotelOS — Phase 5: platform (super) admins
-- A small allowlist of profiles that operate the platform control plane. These
-- users read cross-tenant data via the service-role client in admin routes;
-- this table is the identity check. Grant with `npm run admin:grant <email>`.
-- Idempotent.

create table if not exists platform_admins (
  profile_id uuid primary key references profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

-- A user may see their own admin row (so the app can check membership);
-- inserts/updates happen only via service_role (no write policy).
drop policy if exists "platform_admins self read" on platform_admins;
create policy "platform_admins self read" on platform_admins for select
  using (profile_id = auth.uid());

-- Reusable check (security definer) for app code and future RLS gating.
create or replace function is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from platform_admins where profile_id = auth.uid()
  );
$$;
