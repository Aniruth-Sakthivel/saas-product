# HotelOS — Multi-Product SaaS Platform

HotelOS is **Phase 1** of a multi-product SaaS platform blueprint: a production-grade,
multi-tenant **Hotel Management System** built on Next.js + Supabase. It is designed so
that shared platform services (auth, billing, notifications, analytics) can later be
reused across additional SaaS products (CRM, School, Inventory, Restaurant POS, HRMS).

> **Status:** ✅ Phase 1 (Hotel Management MVP) complete.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Backend / DB:** Supabase (PostgreSQL, Auth, RLS), multi-tenant via `organization_id`
- **UI:** Tailwind CSS v4 + shadcn/ui + Radix UI + Lucide icons
- **State / Data:** TanStack Query, Zustand
- **Forms / Validation:** React Hook Form + Zod
- **Charts:** Recharts
- **Email:** Resend

## Run (current app)

The live application lives in [`app-next/`](app-next/):

```bash
cd app-next
npm install
npm run dev          # start dev server

npm run migrate      # apply SQL migrations
npm run seed         # seed demo data
npm run db:reset     # reset database
```

Configure Supabase credentials in `app-next/.env` (see `src/config/env.ts`).

> **Legacy prototype:** the original frontend-only HTML mockup (`index.html`,
> `reservations.html`, etc.) remains at the repo root. Open `index.html` directly or
> run `npx serve .` to view it. It is retained for reference only.

## Features (Phase 1)

- **Multi-tenant** — every business table is scoped by `organization_id`, enforced by
  Postgres Row Level Security.
- **Authentication & RBAC** — Supabase Auth (SSR), role-based access
  (Owner, Manager, Receptionist, Housekeeping, Accountant), email invites, audit logs.
- **Modules** — Dashboard, Reservations, Front Desk, Rooms, Guests, Housekeeping,
  Billing, Reports, Settings, Organization & staff management, onboarding wizard.

## Architecture

Modular monolith (per blueprint guidance — microservices only when scale demands).
Single Supabase Postgres database, multi-tenant by row. App organized by feature
under `app-next/src/features/*` with shared infra in `app-next/src/lib/*`.

## Roadmap

Derived from the Multi-Product SaaS Platform Blueprint:

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Hotel Management MVP | ✅ Complete |
| 2 | Multi-Tenant Architecture (hardening, FORCE RLS, guards) | ✅ Complete |
| 3 | Subscription & Billing (plans, entitlements, Stripe) | ✅ Complete |
| 4 | Customer Portal (in-app `/portal` hub) | ✅ Complete |
| 5 | Super Admin Platform (in-app `/admin`) | ✅ Complete |
| 6 | Mobile Application (Expo, in `mobile/`) | ✅ Complete |
| 7 | Analytics & Notifications services | ✅ Complete |
| 8 | Additional Products (CRM live; School, Inventory) | ✅ CRM complete |
| 9 | Scaling Infrastructure (cache layer + triggers) | ✅ Foundation ready |

### Phase checklist

- [x] **Phase 1** — Hotel Management MVP (Next.js + Supabase, multi-tenant)
- [x] **Phase 2** — Multi-tenant hardening: FORCE RLS on every table + RLS guard migration + `verify:rls` check + idempotent migrations
- [x] **Phase 3** — Subscription & Billing
  - [x] `plans`/`subscriptions` schema + entitlements (`hasFeature`, `getLimit`, `org_has_feature`)
  - [x] 14-day trial auto-provisioned at onboarding (+ backfill) and surfaced in Settings → Billing
  - [x] Stripe (test): `stripe:sync` products/prices, Checkout action, `/api/billing/webhook` → subscription status, upgrade buttons
- [x] **Phase 4** — Customer Portal: in-app `/portal` hub (My Products, Billing, Organization); SSO via shared Supabase session. Monorepo split deferred to Phase 8 (second product)
- [x] **Phase 5** — Super Admin Platform: `/admin` control plane (platform-admin gate, cross-tenant dashboard/MRR, organizations, plans, audit viewer). Grant via `npm run admin:grant <email>`
- [x] **Phase 6** — Mobile App (Expo Router + Supabase) in [`mobile/`](mobile/): auth, dashboard KPIs, reservations list against the same backend. Offline/push deferred
- [x] **Phase 7** — Analytics & Notifications: channel-based `notify()` (email live via Resend; SMS/push stubs) + template registry; admin `/admin/analytics` (MRR, growth, plan distribution, churn)
- [x] **Phase 8** — CRM product (`/crm`): companies/contacts/deals pipeline, gated by the `crm` entitlement, reusing auth/RLS/portal/notifications. School & Inventory follow the same pattern. Monorepo split still deferred (one deploy target)
- [x] **Phase 9** — Scaling: swappable `cached()` layer (in-process now, Redis-ready) on heavy cross-tenant reads + documented metric-based triggers in [docs/SCALING.md](docs/SCALING.md)

### Guiding principles
- Build platform services once; keep product services independent.
- Multi-tenant architecture throughout.
- Start with a modular monolith; add complexity only when scale demands it.
- Share authentication, billing, notifications, and analytics across products.
- Design every product for both web and mobile.
