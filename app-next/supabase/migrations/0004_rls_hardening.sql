-- HotelOS — Phase 2: Multi-tenant RLS hardening
-- Defense-in-depth on top of 0002_rls.sql. Safe to run repeatedly.
--
-- 1) FORCE row level security so policies apply even to the table owner
--    (not just to the `authenticated` role). `service_role` (BYPASSRLS) still
--    bypasses, which is intended for trusted server-side admin operations.
-- 2) A guard that raises if any business table is missing RLS, so a future
--    table can never ship without tenant isolation.

-- ----------------------------------------------------------------------------
-- 1) FORCE RLS on every business table
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  business_tables text[] := array[
    'profiles','organizations','memberships','room_types','rooms','guests',
    'reservations','stays','invoices','payments','housekeeping_tasks','audit_logs'
  ];
begin
  foreach t in array business_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2) Guard: every base table in `public` must have RLS enabled.
--    Raises an exception (failing the migration) if any table is unprotected.
--    Add a table name here ONLY if it is intentionally tenant-agnostic.
-- ----------------------------------------------------------------------------
do $$
declare
  unprotected text;
  allowlist text[] := array[]::text[]; -- intentionally-public tables (none today)
begin
  select string_agg(c.relname, ', ' order by c.relname)
    into unprotected
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'                 -- ordinary tables only
    and c.relrowsecurity = false        -- RLS not enabled
    and c.relname <> all(allowlist);

  if unprotected is not null then
    raise exception 'RLS guard failed: tables without row level security: %', unprotected;
  end if;
end $$;
