-- HotelOS — initial schema
-- Multi-tenant: every business table carries organization_id.
-- Idempotent: safe to re-run (guarded enums, IF NOT EXISTS, OR REPLACE).

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums (guarded so re-running does not error if the type already exists)
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT');
exception when duplicate_object then null; end $$;
do $$ begin
  create type membership_status as enum ('INVITED', 'ACTIVE', 'DISABLED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type room_status as enum ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE');
exception when duplicate_object then null; end $$;
do $$ begin
  create type reservation_status as enum ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type task_status as enum ('PENDING', 'IN_PROGRESS', 'INSPECTION', 'COMPLETED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type task_priority as enum ('LOW', 'MEDIUM', 'HIGH');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payment_status as enum ('PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payment_method as enum ('CARD', 'CASH', 'BANK_TRANSFER', 'UPI', 'PAYPAL', 'OTHER');
exception when duplicate_object then null; end $$;
do $$ begin
  create type invoice_status as enum ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'REFUNDED', 'CANCELLED');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile when a new auth user is created.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- organizations
-- ----------------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  type text not null default 'City Hotel',
  address text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  logo_url text,
  brand_color text not null default '#4F46E5',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_org_updated before update on organizations
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- memberships (user <-> org with role)
-- ----------------------------------------------------------------------------
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role user_role not null default 'RECEPTIONIST',
  status membership_status not null default 'ACTIVE',
  invited_email text,
  invite_token text unique,
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);
create index if not exists idx_memberships_org on memberships(organization_id);
create index if not exists idx_memberships_profile on memberships(profile_id);
create or replace trigger trg_memberships_updated before update on memberships
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- room_types
-- ----------------------------------------------------------------------------
create table if not exists room_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(10,2) not null default 0,
  capacity int not null default 2,
  beds text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_room_types_org on room_types(organization_id);
create or replace trigger trg_room_types_updated before update on room_types
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- rooms
-- ----------------------------------------------------------------------------
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  number text not null,
  room_type_id uuid references room_types(id) on delete set null,
  floor int not null default 1,
  status room_status not null default 'AVAILABLE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);
create index if not exists idx_rooms_org on rooms(organization_id);
create index if not exists idx_rooms_status on rooms(organization_id, status);
create or replace trigger trg_rooms_updated before update on rooms
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- guests
-- ----------------------------------------------------------------------------
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  city text,
  vip boolean not null default false,
  preferences jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guests_org on guests(organization_id);
create or replace trigger trg_guests_updated before update on guests
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- reservations
-- ----------------------------------------------------------------------------
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  guest_id uuid not null references guests(id) on delete restrict,
  room_id uuid references rooms(id) on delete set null,
  room_type_id uuid references room_types(id) on delete set null,
  check_in date not null,
  check_out date not null,
  guests_count int not null default 1,
  status reservation_status not null default 'PENDING',
  source text not null default 'Direct',
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code),
  check (check_out > check_in)
);
create index if not exists idx_reservations_org on reservations(organization_id);
create index if not exists idx_reservations_status on reservations(organization_id, status);
create index if not exists idx_reservations_dates on reservations(organization_id, check_in, check_out);
create or replace trigger trg_reservations_updated before update on reservations
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- stays (active occupancy from check-in to check-out)
-- ----------------------------------------------------------------------------
create table if not exists stays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  reservation_id uuid not null references reservations(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete restrict,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_stays_org on stays(organization_id);
create or replace trigger trg_stays_updated before update on stays
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- invoices
-- ----------------------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  number text not null,
  reservation_id uuid references reservations(id) on delete set null,
  guest_id uuid references guests(id) on delete set null,
  subtotal numeric(10,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  gst_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status invoice_status not null default 'DRAFT',
  issued_at date not null default current_date,
  due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);
create index if not exists idx_invoices_org on invoices(organization_id);
create index if not exists idx_invoices_status on invoices(organization_id, status);
create or replace trigger trg_invoices_updated before update on invoices
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  amount numeric(10,2) not null,
  method payment_method not null default 'CARD',
  status payment_status not null default 'PAID',
  reference text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_org on payments(organization_id);
create or replace trigger trg_payments_updated before update on payments
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- housekeeping_tasks
-- ----------------------------------------------------------------------------
create table if not exists housekeeping_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  room_id uuid references rooms(id) on delete set null,
  assignee_membership_id uuid references memberships(id) on delete set null,
  title text not null default 'Full clean',
  priority task_priority not null default 'MEDIUM',
  status task_status not null default 'PENDING',
  due_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_hk_org on housekeeping_tasks(organization_id);
create index if not exists idx_hk_status on housekeeping_tasks(organization_id, status);
create or replace trigger trg_hk_updated before update on housekeeping_tasks
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_org on audit_logs(organization_id, created_at desc);
