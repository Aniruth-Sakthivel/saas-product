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
| 5 | Super Admin Platform (`admin.company.com`) | 🔜 Next |
| 6 | Mobile Application (React Native + Expo) | Planned |
| 7 | Analytics & Notifications services | Planned |
| 8 | Additional Products (CRM, School, Inventory) | Planned |
| 9 | Scaling Infrastructure (Redis, queues, read replicas) | Planned |

### Phase checklist

- [x] **Phase 1** — Hotel Management MVP (Next.js + Supabase, multi-tenant)
- [x] **Phase 2** — Multi-tenant hardening: FORCE RLS on every table + RLS guard migration + `verify:rls` check + idempotent migrations
- [x] **Phase 3** — Subscription & Billing
  - [x] `plans`/`subscriptions` schema + entitlements (`hasFeature`, `getLimit`, `org_has_feature`)
  - [x] 14-day trial auto-provisioned at onboarding (+ backfill) and surfaced in Settings → Billing
  - [x] Stripe (test): `stripe:sync` products/prices, Checkout action, `/api/billing/webhook` → subscription status, upgrade buttons
- [x] **Phase 4** — Customer Portal: in-app `/portal` hub (My Products, Billing, Organization); SSO via shared Supabase session. Monorepo split deferred to Phase 8 (second product)
- [ ] **Phase 5** — Super Admin Platform: orgs, plans, payments, feature flags, audit viewer
- [ ] **Phase 6** — Mobile App (React Native + Expo): shared api-client, offline, push
- [ ] **Phase 7** — Analytics & Notifications services (`notify()` interface, revenue/churn analytics)
- [ ] **Phase 8** — Additional products (CRM first, then School, Inventory) reusing platform services
- [ ] **Phase 9** — Scaling infrastructure: Redis, queues, read replicas (metric-triggered)

### Guiding principles
- Build platform services once; keep product services independent.
- Multi-tenant architecture throughout.
- Start with a modular monolith; add complexity only when scale demands it.
- Share authentication, billing, notifications, and analytics across products.
- Design every product for both web and mobile.
