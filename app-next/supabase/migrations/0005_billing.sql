-- HotelOS — Phase 3: Subscription & Billing (platform layer)
-- `plans` is a global catalog (not tenant-scoped). `subscriptions` is one row per
-- organization. Entitlements are derived from the subscribed plan's `features`/`limits`.
-- Idempotent: guarded enums, IF NOT EXISTS, drop-then-create policies.

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type subscription_status as enum
    ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');
exception when duplicate_object then null; end $$;
do $$ begin
  create type billing_interval as enum ('MONTHLY', 'YEARLY');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- plans (global catalog — readable by everyone, writable only by service_role)
-- ----------------------------------------------------------------------------
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                       -- 'free' | 'starter' | 'pro'
  name text not null,
  description text,
  price_monthly numeric(10,2) not null default 0,
  price_yearly numeric(10,2) not null default 0,
  currency text not null default 'USD',
  features jsonb not null default '[]'::jsonb,      -- array of feature keys
  limits jsonb not null default '{}'::jsonb,        -- { "rooms": 10, "staff": 3 } (null = unlimited)
  stripe_product_id text,
  stripe_price_monthly_id text,
  stripe_price_yearly_id text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_plans_updated before update on plans
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- subscriptions (one per organization)
-- ----------------------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status subscription_status not null default 'TRIALING',
  interval billing_interval not null default 'MONTHLY',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_org on subscriptions(organization_id);
create index if not exists idx_subscriptions_status on subscriptions(status);
create or replace trigger trg_subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Entitlement helper (security definer) — reusable from app code and future
-- product-table RLS. An entitlement is active only while the subscription is
-- TRIALING or ACTIVE.
-- ----------------------------------------------------------------------------
create or replace function org_has_feature(org uuid, feature text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from subscriptions s
    join plans p on p.id = s.plan_id
    where s.organization_id = org
      and s.status in ('TRIALING', 'ACTIVE')
      and p.features ? feature
  );
$$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table subscriptions force row level security;

-- plans: the catalog is public pricing info — any signed-in user can read it.
-- There is intentionally no write policy, so writes are blocked under RLS and
-- only happen via service_role (seed migrations / admin tooling).
drop policy if exists "plans public read" on plans;
create policy "plans public read" on plans for select using (true);

-- subscriptions: org members read; only OWNER may change (most writes come from
-- the Stripe webhook via service_role, which bypasses RLS).
drop policy if exists "subscriptions member read" on subscriptions;
create policy "subscriptions member read" on subscriptions for select
  using (is_org_member(organization_id));
drop policy if exists "subscriptions owner write" on subscriptions;
create policy "subscriptions owner write" on subscriptions for all
  using (has_org_role(organization_id, array['OWNER']::user_role[]))
  with check (has_org_role(organization_id, array['OWNER']::user_role[]));

-- ----------------------------------------------------------------------------
-- Seed default plans (idempotent on code)
-- ----------------------------------------------------------------------------
insert into plans (code, name, description, price_monthly, price_yearly, features, limits, sort_order)
values
  ('free', 'Free', 'Get started with a single property.', 0, 0,
   '["hotel"]'::jsonb, '{"rooms": 10, "staff": 3}'::jsonb, 0),
  ('starter', 'Starter', 'For growing independent hotels.', 29, 290,
   '["hotel","reports.advanced"]'::jsonb, '{"rooms": 50, "staff": 10}'::jsonb, 1),
  ('pro', 'Pro', 'Unlimited scale with analytics and CRM.', 99, 990,
   '["hotel","reports.advanced","analytics","crm"]'::jsonb,
   '{"rooms": null, "staff": null}'::jsonb, 2)
on conflict (code) do nothing;
