-- HotelOS Platform — Phase 10: realtime for operational tables
-- Streams rooms, housekeeping, and billing changes to the admin panel so the
-- Rooms board, Front Desk, Housekeeping, and Billing pages stay in sync live.
-- Idempotent.

alter table rooms              replica identity full;
alter table room_types         replica identity full;
alter table housekeeping_tasks replica identity full;
alter table invoices           replica identity full;
alter table payments           replica identity full;
alter table stays              replica identity full;

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array[
    'rooms', 'room_types', 'housekeeping_tasks', 'invoices', 'payments', 'stays'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
