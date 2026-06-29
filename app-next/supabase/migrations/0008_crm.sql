-- HotelOS Platform — Phase 8: CRM product schema
-- A second product reusing the platform (auth, RLS, entitlements). Tables are
-- prefixed `crm_` to keep product namespaces clear in the shared database.
-- Multi-tenant by organization_id; access gated in-app by the `crm` feature.
-- Idempotent.

do $$ begin
  create type deal_stage as enum
    ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- crm_companies
-- ----------------------------------------------------------------------------
create table if not exists crm_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  website text,
  industry text,
  city text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_companies_org on crm_companies(organization_id);
create or replace trigger trg_crm_companies_updated before update on crm_companies
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- crm_contacts
-- ----------------------------------------------------------------------------
create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid references crm_companies(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_contacts_org on crm_contacts(organization_id);
create or replace trigger trg_crm_contacts_updated before update on crm_contacts
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- crm_deals
-- ----------------------------------------------------------------------------
create table if not exists crm_deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid references crm_companies(id) on delete set null,
  contact_id uuid references crm_contacts(id) on delete set null,
  title text not null,
  value numeric(12,2) not null default 0,
  stage deal_stage not null default 'LEAD',
  owner_membership_id uuid references memberships(id) on delete set null,
  expected_close date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_deals_org on crm_deals(organization_id);
create index if not exists idx_crm_deals_stage on crm_deals(organization_id, stage);
create or replace trigger trg_crm_deals_updated before update on crm_deals
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — any active member of the org reads/writes the org's CRM data.
-- ----------------------------------------------------------------------------
alter table crm_companies enable row level security;
alter table crm_companies force row level security;
alter table crm_contacts  enable row level security;
alter table crm_contacts  force row level security;
alter table crm_deals     enable row level security;
alter table crm_deals     force row level security;

drop policy if exists "crm_companies member all" on crm_companies;
create policy "crm_companies member all" on crm_companies for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop policy if exists "crm_contacts member all" on crm_contacts;
create policy "crm_contacts member all" on crm_contacts for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop policy if exists "crm_deals member all" on crm_deals;
create policy "crm_deals member all" on crm_deals for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
