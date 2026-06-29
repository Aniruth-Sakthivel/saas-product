================================================================================
HOTELOS — MULTI-PRODUCT SaaS PLATFORM · COMPLETE PROJECT GUIDE
================================================================================
Version: 1.0
Stack:   Next.js 15 · React 19 · TypeScript · Supabase (Postgres/Auth/RLS) ·
         Stripe · Resend · Expo (React Native)
Status:  All 9 blueprint phases complete.

This is the single reference for the whole project: what it is, how it is built,
how to run it, and how to operate and extend it.

--------------------------------------------------------------------------------
TABLE OF CONTENTS
--------------------------------------------------------------------------------
  1.  What this project is
  2.  High-level architecture
  3.  Repository layout
  4.  The 9 phases (what was built and why)
  5.  Data model (database schema)
  6.  Security model (multi-tenancy & RLS)
  7.  Entitlements & billing
  8.  Applications (web areas + mobile)
  9.  Environment variables
  10. Setup & run (web)
  11. Setup & run (mobile)
  12. Operational scripts (npm commands)
  13. Verification ladder
  14. How to add a new product (recipe)
  15. Scaling strategy
  16. Key files reference
  17. Test credentials & demo data
  18. Glossary

================================================================================
1. WHAT THIS PROJECT IS
================================================================================
HotelOS is a multi-tenant, multi-product SaaS platform. The first product is a
Hotel Management System; the architecture lets additional products (CRM — built;
School, Inventory, etc.) reuse one shared set of platform services:

  - Single authentication (Supabase Auth)
  - Single billing & subscriptions (Stripe + entitlements)
  - One customer portal, one super-admin control plane
  - Shared notifications and analytics
  - Web + mobile clients against the same backend

Guiding principle (followed throughout): build platform services once, keep
products independent, start as a modular monolith, and add complexity only when
a metric demands it.

================================================================================
2. HIGH-LEVEL ARCHITECTURE
================================================================================
  Browser / Mobile (Expo)
        |
        v
  Next.js 15 App Router (app-next/)  ---- Server Actions + Route Handlers
        |                                   |
        |  Supabase JS (anon, RLS-bound)    |  service-role client (bypasses RLS;
        v                                   v  used only in trusted server code)
  Supabase Postgres  <----- Row Level Security enforces tenant isolation
        ^
        |  Stripe webhooks -> /api/billing/webhook -> subscriptions table
        |  Resend (email) via notify()

  Single Postgres database. Multi-tenant by `organization_id` on every business
  table. Products share the DB but use table-name prefixes (e.g. crm_*).

Route groups inside the one Next.js app:
  (app)    -> the Hotel product (dashboard, reservations, rooms, etc.)
  (auth)   -> login / signup / verify / forgot-password
  (portal) -> customer portal hub (My Products, Billing, Organization)
  (admin)  -> super-admin control plane (gated by platform_admins)
  (crm)    -> the CRM product (gated by the `crm` entitlement)

================================================================================
3. REPOSITORY LAYOUT
================================================================================
  hotel-demo/
  |- app-next/                  The live Next.js + Supabase application
  |  |- src/
  |  |  |- app/                 App Router route groups (see section 8)
  |  |  |- components/          Shared UI (ui/*, app-shell, portal, admin, crm)
  |  |  |- features/            Feature modules (schemas/services/actions/components)
  |  |  |  |- auth, organizations, rooms, reservations, guests, housekeeping,
  |  |  |  |  billing, dashboard, admin, crm
  |  |  |- lib/                 Platform services: auth, rbac, entitlements,
  |  |  |  |  subscriptions, stripe, notifications/, cache, admin, audit, supabase/
  |  |  |- constants/           navigation.ts, products.ts
  |  |  |- config/              env.ts (typed env access)
  |  |  |- types/               database.ts (hand-authored Supabase types)
  |  |- supabase/
  |  |  |- migrations/          0001..0008 SQL (idempotent)
  |  |  |- migrate.ts, reset.ts, seed.ts, verify-rls.ts, stripe-sync.ts,
  |  |  |  admin-grant.ts
  |  |- package.json
  |- mobile/                    Expo (React Native) client
  |  |- app/                    expo-router screens
  |  |- lib/                    supabase.ts, auth.tsx, types.ts
  |  |- theme.ts, app.json, package.json, README.md
  |- docs/
  |  |- SCALING.md              Metric-triggered scaling plan
  |- site/, assets/, *.html     Legacy static HTML prototype (reference only)
  |- README.md                  Overview + phase checklist + roadmap
  |- PROJECT_GUIDE.md           <- this file

================================================================================
4. THE 9 PHASES (WHAT WAS BUILT AND WHY)
================================================================================
PHASE 1 — Hotel Management MVP
  Multi-tenant Next.js + Supabase app. Auth, RBAC, organizations, rooms,
  reservations, guests, housekeeping, billing (hotel invoices), reports,
  dashboard, onboarding. Every business table carries organization_id.

PHASE 2 — Multi-tenant hardening
  - Made all migrations idempotent (guarded enums, IF NOT EXISTS, OR REPLACE,
    drop-then-create policies) so `npm run migrate` is safely re-runnable.
  - FORCE row level security on every tenant table (policies bind even the table
    owner; only service_role bypasses).
  - RLS guard in migration 0004 + `npm run verify:rls` (fails if any public
    table lacks RLS, or an organization_id table is not FORCEd).

PHASE 3 — Subscription & Billing
  - plans (catalog) + subscriptions (one per org) tables; org_has_feature() SQL.
  - Entitlements helper (lib/entitlements.ts): hasFeature / getLimit / isWithinLimit.
  - 14-day Pro trial auto-provisioned at onboarding (+ backfill migration 0006).
  - Stripe (test mode): lib/stripe.ts, `npm run stripe:sync` (creates products/
    prices from plans), Checkout server action, /api/billing/webhook mapping
    Stripe events -> subscription status. Upgrade buttons in Settings -> Billing.

PHASE 4 — Customer Portal (in-app hub)
  /portal: My Products (launch by entitlement), Billing, Organization. SSO is
  automatic (same Supabase session). Monorepo split deferred until a second
  deploy target exists.

PHASE 5 — Super Admin Platform
  platform_admins allowlist + is_platform_admin() + requirePlatformAdmin() gate.
  /admin: cross-tenant dashboard (orgs, active subs, trials, MRR), analytics
  (growth, plan distribution, churn), organizations, plans, audit-log viewer.
  Grant with `npm run admin:grant <email>`.

PHASE 6 — Mobile App (Expo)
  mobile/: Expo Router app on the same Supabase backend. Auth (persisted
  session), dashboard KPIs, reservations list. Offline/push deferred.

PHASE 7 — Analytics & Notifications
  - notify() service (lib/notifications/): channel-based (email live via Resend;
    sms/push stubs), typed template registry. Staff invites routed through it.
  - Platform analytics service + /admin/analytics page (Recharts).

PHASE 8 — CRM (second product)
  crm_companies / crm_contacts / crm_deals (migration 0008), gated by the `crm`
  entitlement via requireFeatureContext("crm"). /crm overview, contacts (+create),
  deals pipeline (+create). Proves the platform abstractions: it reuses auth,
  RLS, entitlements, portal, audit, notifications with no rebuild.

PHASE 9 — Scaling foundation
  Swappable cache (lib/cache.ts): in-process TTL now, Redis-ready via the
  CacheBackend interface; applied to heavy cross-tenant admin reads. Metric-based
  scaling triggers documented in docs/SCALING.md.

================================================================================
5. DATA MODEL (DATABASE SCHEMA)
================================================================================
Migrations live in app-next/supabase/migrations and run in order:

  0001_init.sql              Core schema + enums + updated_at trigger
  0002_rls.sql               Helper fns (is_org_member, has_org_role) + policies
  0003_grants.sql            Supabase role grants on public schema
  0004_rls_hardening.sql     FORCE RLS on all tables + RLS guard
  0005_billing.sql           plans, subscriptions, org_has_feature() + seed plans
  0006_backfill_subscriptions.sql  Trials for pre-existing orgs
  0007_platform_admins.sql   platform_admins + is_platform_admin()
  0008_crm.sql               crm_companies, crm_contacts, crm_deals

Core tables (all business tables include organization_id):
  profiles, organizations, memberships, room_types, rooms, guests,
  reservations, stays, invoices, payments, housekeeping_tasks, audit_logs,
  plans, subscriptions, platform_admins, crm_companies, crm_contacts, crm_deals

Key enums:
  user_role (OWNER, MANAGER, RECEPTIONIST, HOUSEKEEPING, ACCOUNTANT),
  membership_status, room_status, reservation_status, task_status,
  task_priority, payment_status, payment_method, invoice_status,
  subscription_status (TRIALING, ACTIVE, PAST_DUE, CANCELED, INCOMPLETE),
  billing_interval (MONTHLY, YEARLY), deal_stage.

TypeScript mirror of the schema: app-next/src/types/database.ts (kept in sync by
hand; regenerate with `supabase gen types` once the CLI is linked).

================================================================================
6. SECURITY MODEL (MULTI-TENANCY & RLS)
================================================================================
- Every business row belongs to an organization (organization_id).
- Row Level Security is the enforcement boundary, NOT application WHERE clauses.
  Helper functions (security definer) drive policies:
    is_org_member(org)        -> caller is an ACTIVE member of org
    has_org_role(org, roles)  -> caller has one of the roles in org
    org_has_feature(org, key) -> org's plan includes a feature (for future RLS)
    is_platform_admin()       -> caller is on the platform_admins allowlist
- FORCE RLS means even the table owner obeys policies. Only the service_role key
  bypasses RLS; it is used solely in trusted server code:
    * /api/billing/webhook (Stripe -> subscriptions)
    * admin pages (cross-tenant reads) — always behind requirePlatformAdmin()
    * invite acceptance, seeding scripts
- App-layer RBAC (lib/rbac.ts) mirrors the DB policies for UI/Server Action gating.
- Guard: `npm run verify:rls` proves no table ships without RLS.

================================================================================
7. ENTITLEMENTS & BILLING
================================================================================
Plans (seeded): free, starter, pro. Each plan row has:
  features (jsonb array, e.g. ["hotel","reports.advanced","analytics","crm"])
  limits   (jsonb, e.g. {"rooms":50,"staff":10}; null = unlimited)

Entitlements (app-next/src/lib/entitlements.ts):
  hasFeature(orgId, feature)         -> boolean (TRIALING/ACTIVE count as active)
  getEntitlements(orgId)             -> { plan, subscription, features, limits }
  getLimit(orgId, key)               -> number | null (null = unlimited)
  isWithinLimit(orgId, key, count)   -> boolean

Product gating: requireFeatureContext("crm") guards the whole (crm) route group;
non-entitled orgs are redirected to /portal/billing.

Billing lifecycle:
  signup -> org created -> 14-day Pro TRIAL auto-provisioned
  upgrade -> Checkout server action -> Stripe hosted checkout
  payment -> Stripe webhook -> subscriptions.status = ACTIVE (+ plan, period end)
  failed/cancel -> webhook -> PAST_DUE / CANCELED

Stripe is TEST MODE. Products/prices are created from the plans table by
`npm run stripe:sync`. Local webhooks via the Stripe CLI:
  stripe listen --forward-to localhost:3000/api/billing/webhook
Test card: 4242 4242 4242 4242, any future expiry, any CVC/ZIP.

================================================================================
8. APPLICATIONS (WEB AREAS + MOBILE)
================================================================================
WEB (app-next) route groups & key routes:
  (auth)   /login /signup /verify /forgot-password
  (app)    /dashboard /reservations /frontdesk /rooms /guests /housekeeping
           /billing /reports /settings  (+ /onboarding)
  (portal) /portal /portal/billing /portal/organization
  (admin)  /admin /admin/analytics /admin/organizations /admin/plans /admin/audit
  (crm)    /crm /crm/contacts /crm/deals
  api      /api/billing/webhook  /api/invites/accept  /auth/callback

MOBILE (mobile/, Expo Router):
  app/_layout.tsx        root + auth gate (login <-> tabs)
  app/login.tsx          email/password sign-in
  app/(tabs)/index.tsx   dashboard KPIs (rooms, arrivals, in-house)
  app/(tabs)/reservations.tsx  reservations list with status badges

================================================================================
9. ENVIRONMENT VARIABLES
================================================================================
WEB — app-next/.env.local (gitignored):
  NEXT_PUBLIC_SUPABASE_URL          Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY     Supabase anon (public) key
  SUPABASE_SERVICE_ROLE_KEY         Service role key (server-only; bypasses RLS)
  SUPABASE_DB_URL                   Direct Postgres connection (for migrate/seed)
  NEXT_PUBLIC_APP_URL               e.g. http://localhost:3000
  RESEND_API_KEY                    (optional) email delivery; logs if absent
  RESEND_FROM_EMAIL                 (optional) From address
  STRIPE_SECRET_KEY                 sk_test_... (test mode)
  STRIPE_WEBHOOK_SECRET             whsec_... (from `stripe listen`)

MOBILE — mobile/.env (gitignored):
  EXPO_PUBLIC_SUPABASE_URL          Same project as web
  EXPO_PUBLIC_SUPABASE_ANON_KEY     Same anon key as web

NOTE: never commit real keys. .env.local and mobile/.env are gitignored.

================================================================================
10. SETUP & RUN (WEB)
================================================================================
  cd app-next
  npm install
  # create .env.local with the variables in section 9
  npm run migrate        # apply all SQL migrations (idempotent)
  npm run seed           # seed demo data (Grand Marina Hotel)
  npm run stripe:sync    # create Stripe products/prices from plans (needs STRIPE_SECRET_KEY)
  npm run dev            # http://localhost:3000

  # In a second terminal, for Stripe webhooks locally:
  stripe listen --forward-to localhost:3000/api/billing/webhook
  # copy the printed whsec_... into STRIPE_WEBHOOK_SECRET, then restart `npm run dev`

  # Grant yourself super-admin (after signing up or seeding):
  npm run admin:grant <your-email>

================================================================================
11. SETUP & RUN (MOBILE)
================================================================================
  cd mobile
  npm install
  cp .env.example .env   # fill EXPO_PUBLIC_* with the SAME Supabase project as web
  npm start              # press i / a, or scan the QR with Expo Go
  # Sign in with a real user (e.g. the seeded owner account).

================================================================================
12. OPERATIONAL SCRIPTS (npm commands, run in app-next/)
================================================================================
  npm run dev            Start Next.js dev server
  npm run build          Production build
  npm run start          Run the production build
  npm run lint           ESLint
  npm run typecheck      tsc --noEmit
  npm run migrate        Apply SQL migrations (idempotent)
  npm run seed           Seed demo data
  npm run db:reset       Reset the database
  npm run verify:rls     Assert RLS is enabled/forced on all tenant tables
  npm run stripe:sync    Create Stripe products/prices from the plans table
  npm run admin:grant X  Promote profile with email X to platform admin
  npm run admin:list     List platform admins

  Mobile (in mobile/): npm start | npm run android | npm run ios | npm run typecheck

================================================================================
13. VERIFICATION LADDER (all green)
================================================================================
  app-next:  migrate (idempotent) -> verify:rls (18 tables) -> typecheck ->
             lint -> build (31 routes)
  mobile:    typecheck

Run before committing:
  cd app-next && npm run typecheck && npm run lint && npm run build && npm run verify:rls

================================================================================
14. HOW TO ADD A NEW PRODUCT (RECIPE)
================================================================================
The CRM established the repeatable pattern. To add e.g. "School":
  1. Migration: create school_* tables with organization_id + RLS (enable+force)
     and member policies. Reuse is_org_member().  -> npm run migrate
  2. Types: add rows/aliases in src/types/database.ts.
  3. Entitlement: add a feature key (e.g. "school") to FeatureKey and to the
     relevant plan(s) `features` array (seed/migration).
  4. Route group: src/app/(school)/ with a layout that calls
     requireFeatureContext("school"), plus pages.
  5. Feature module: src/features/school/{schemas,services,actions,components}.
  6. Catalog: add the product to src/constants/products.ts (status "live",
     feature "school", href "/school"). It then appears in the portal.
  7. Verify: typecheck, lint, build, verify:rls.

================================================================================
15. SCALING STRATEGY (see docs/SCALING.md for full detail)
================================================================================
Add infrastructure only when a metric demands it. Seams already in place make
each upgrade a backend swap, not a refactor:
  - cached() helper (lib/cache.ts)  -> swap in-process map for Redis when multi-instance
  - notify() interface              -> move sends to a queue (BullMQ) under load
  - organization_id + RLS           -> move a product to its own schema/DB if it dominates
  - read replicas                   -> when analytics reads compete with writes
  - monorepo packages/              -> only when a second deploy target exists
Do NOT pre-split into microservices.

================================================================================
16. KEY FILES REFERENCE
================================================================================
  Platform services (app-next/src/lib):
    auth.ts            getCurrentUser, requireActiveContext, assertRole,
                       requireFeatureContext
    rbac.ts            roles, permissions, can()
    entitlements.ts    hasFeature, getLimit, isWithinLimit, getEntitlements
    subscriptions.ts   provisionTrialSubscription (14-day Pro trial)
    stripe.ts          lazy server-only Stripe client
    notifications/     notify(), channels (email/sms/push), template registry
    cache.ts           CacheBackend + cached() (Redis-ready)
    admin.ts           isPlatformAdmin, requirePlatformAdmin
    audit.ts           writeAuditLog
    supabase/          server.ts, client.ts, admin.ts (service role), middleware.ts

  Config/constants:
    config/env.ts            typed env access (throws on missing required vars)
    constants/products.ts    product catalog (drives the portal)
    constants/navigation.ts  hotel app sidebar nav

  Routing entry points:
    app/api/billing/webhook/route.ts   Stripe webhook -> subscriptions
    app/(crm)/layout.tsx               entitlement-gated product layout
    app/(admin)/layout.tsx             platform-admin-gated control plane

  Database tooling (app-next/supabase):
    migrate.ts, seed.ts, reset.ts, verify-rls.ts, stripe-sync.ts, admin-grant.ts

================================================================================
17. TEST CREDENTIALS & DEMO DATA
================================================================================
  Seed creates the "Grand Marina Hotel" organization with an OWNER account:
    owner@grandmarina.test   (password set by seed.ts; check that file)
  This org is on a Pro TRIAL, so it has ALL features (including CRM).
  It has been granted platform-admin, so it can access /admin.

  Stripe test card: 4242 4242 4242 4242, any future date, any CVC.

================================================================================
18. GLOSSARY
================================================================================
  Tenant / Organization  A customer workspace. Data is isolated by organization_id.
  RLS                    Row Level Security — Postgres policies enforcing isolation.
  service_role           Supabase key that bypasses RLS; trusted server use only.
  Entitlement            A capability unlocked by the org's plan (a feature key).
  Platform admin         Operator on the platform_admins allowlist (sees all tenants).
  MRR                    Monthly Recurring Revenue (sum of active plans' monthly price).
  notify()               Single entry point for email/sms/push notifications.
  Modular monolith       One deployable app, cleanly modularized — the current shape.

================================================================================
END OF GUIDE
================================================================================
