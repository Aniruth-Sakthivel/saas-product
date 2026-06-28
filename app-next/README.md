# HotelOS — Production SaaS (Next.js 15 + Supabase)

Multi-tenant, RBAC-secured hotel management SaaS. This `app-next/` project is the real product; the static prototype at the repo root is kept only as a visual reference.

> Full implementation plan also lives at `.claude/plans/hotelos-full-expressive-emerson.md`.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (new-york, neutral base)
- **Supabase** — Postgres, Auth, Storage (`@supabase/ssr`)
- **TanStack Query** (client data), **Zustand** (UI state)
- **React Hook Form** + **Zod** (forms & validation)
- **Recharts** (charts), **Resend** (email), **Vercel** (deploy)

## Scope of current build

- **Foundation**: project scaffold, full DB schema + migrations + RLS for all spec tables, typed Supabase clients, RBAC primitives, shared UI + app shell, seed script.
- **Phase 1 (working)**: Authentication, Organization setup & staff invites, Dashboard.
- **Phases 2–5** (rooms, reservations, frontdesk, guests, housekeeping, billing, reports): scaffolded as typed stubs.

## Architecture

- Feature-based: `src/features/<feature>/{components,actions,schemas,services,types,hooks}`.
- Server Components by default; Client Components only where interactive.
- All mutations are **Server Actions** returning a typed `ActionResult<T>`, gated by Zod validation + RBAC + audit logging.
- **Multi-tenant**: every business table has `organization_id`; **RLS** authorizes via membership lookups (`is_org_member`, `has_org_role`). App-layer RBAC (`lib/rbac.ts`) mirrors RLS for UX.

### Roles
`OWNER`, `MANAGER`, `RECEPTIONIST`, `HOUSEKEEPING`, `ACCOUNTANT`.

### Database tables
`organizations`, `profiles`, `memberships`, `room_types`, `rooms`, `guests`, `reservations`, `stays`, `payments`, `invoices`, `housekeeping_tasks`, `audit_logs`.

## Getting started

```bash
cd app-next
npm install

# 1. Configure environment
cp .env.example .env.local
#    Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#    SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API),
#    SUPABASE_DB_URL (for migrations/seed), RESEND_API_KEY.

# 2. Apply migrations (Supabase SQL editor, or CLI db push)
#    Run supabase/migrations/0001_init.sql then 0002_rls.sql

# 3. Seed demo data (rooms 101–150, ~50 guests, ~30 reservations)
npm run seed

# 4. Run
npm run dev
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next) |
| `npm run seed` | Seed demo org + data via service-role key |

## Folder structure

```
app-next/
  supabase/migrations/   0001_init.sql, 0002_rls.sql
  supabase/seed.ts
  src/
    app/                 (auth) routes, (app) authed shell, onboarding, api
    components/          ui/ (shadcn) + shared app components
    features/            auth, organizations, dashboard, rooms, reservations, ...
    lib/                 supabase/, rbac, auth, audit, errors, validation, email
    hooks/ store/ types/ constants/ config/
    middleware.ts
```

## Security

- Row Level Security on every table; all routes protected by middleware.
- All inputs validated with Zod; mutations audit-logged to `audit_logs`.
- Secrets only in `.env.local` (gitignored). **Rotate the Supabase DB password** if it was shared in plaintext.

## Verification

`npm run build` + `npm run typecheck` pass locally. End-to-end (sign up → onboarding → dashboard, staff invite, RBAC/RLS checks) requires `.env.local` + applied migrations + seed. See the plan file's Verification section.

---

# Full Implementation Plan

## Context

The repo `d:\Github\hotel-demo` currently holds a **static HTML + Tailwind-CDN prototype** (root dashboard pages + `/site` marketing site, vanilla JS in `/assets` and `/site/assets`). There is no Node tooling, no `package.json`, no framework.

The goal is to begin building the real product: a **multi-tenant, RBAC-secured hotel management SaaS** on Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage) + Resend, per the provided spec.

**This execution delivers (confirmed scope):**
- **Foundation**: full project scaffold, config, complete DB schema + migrations + RLS for *all* spec tables, typed Supabase clients, shared UI (shadcn/ui), app shell, RBAC primitives, seed script.
- **Phase 1 fully working**: Authentication, Organization setup/staff, Dashboard.
- **Phases 2–5** (rooms, reservations, frontdesk, guests, housekeeping, billing, reports): scaffolded as **typed stubs** (folders, Zod schemas, type definitions, placeholder pages/actions) so the architecture is in place but logic is deferred.

**Confirmed decisions:**
- Location: **new `/app-next` subfolder** (prototype left untouched at root, used only as visual reference).
- Supabase: **user has a project ready** — project name `hotel-management`. DB password supplied (used only for direct Postgres / migration connection string, stored in gitignored `.env.local`, never committed; should be rotated since shared in chat). **Still needed from the user**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Project Settings → API). Code references these via env vars so the build proceeds without them; only end-to-end verification is blocked until provided.
- Data: **real Supabase + a seed script** mirroring the prototype's mock data (rooms 101–150, ~50 guests, ~30 reservations).

---

## Tech & key library notes (current best practice)

- **Supabase SSR**: use `@supabase/ssr` with `createServerClient` / `createBrowserClient`. **Do not** use the deprecated `@supabase/auth-helpers-nextjs`.
- **Next.js 15**: `cookies()`/`headers()` are async — `await` them. Server Components by default; Client Components only for interactive bits.
- **Middleware** refreshes the auth session on every request and guards protected routes.
- **Tailwind CSS v4**: CSS-first config (`@import "tailwindcss"` + `@theme`), no `tailwind.config.js` required. Use shadcn/ui CLI canary which supports v4.
- **RBAC + multi-tenancy**: every business table has `organization_id`; RLS policies authorize via a membership lookup. App-layer guards mirror RLS for UX.

---

## Folder structure (`/app-next`)

```
app-next/
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs, components.json
  .env.example, .env.local (user-provided), .gitignore
  supabase/
    migrations/0001_init.sql          # tables, enums, indexes
    migrations/0002_rls.sql           # RLS policies + helper fns
    seed.ts                           # seeds one demo org from prototype data
  src/
    app/
      (auth)/login, /signup, /forgot-password, /verify   # auth route group
      (app)/                          # authed shell (sidebar+topbar)
        dashboard/page.tsx
        organizations/ (settings + staff)
        rooms/ reservations/ frontdesk/ guests/ housekeeping/ billing/ reports/ settings/
      onboarding/page.tsx             # create-hotel wizard
      api/                            # Route Handlers (webhooks, invites accept)
      layout.tsx, globals.css
    components/ui/                    # shadcn primitives
    components/                       # shared app components (AppShell, Sidebar, Topbar, DataTable, KpiCard, StatusBadge, EmptyState, Drawer, ChartCard)
    features/
      auth/        { actions, schemas, services, types, hooks, components }
      organizations/  ...
      dashboard/   ...
      rooms/ reservations/ guests/ frontdesk/ housekeeping/ billing/ reports/ settings/  (stubs)
    lib/
      supabase/{server.ts,client.ts,middleware.ts,admin.ts}
      rbac.ts            # role permission matrix + can() helper
      auth.ts            # getSession/getCurrentUser/getActiveOrg/requireRole
      audit.ts           # writeAuditLog()
      validation.ts, utils.ts, errors.ts (ActionResult<T> type)
      email/resend.ts    # Resend client + invite template
    hooks/   store/   types/   constants/   config/
    middleware.ts
```

Each feature follows the spec's internal structure: `components/ actions/ schemas/ services/ types/ hooks/`.

---

## Database design (`supabase/migrations/0001_init.sql`)

Enums: `user_role` (OWNER, MANAGER, RECEPTIONIST, HOUSEKEEPING, ACCOUNTANT), `room_status` (AVAILABLE, OCCUPIED, RESERVED, CLEANING, MAINTENANCE), `reservation_status` (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED), `task_status` (PENDING, IN_PROGRESS, INSPECTION, COMPLETED), `payment_status`, `invoice_status`.

Tables (all business tables carry `organization_id uuid not null references organizations(id)`, plus `created_at`, `updated_at`):
- `organizations` (id, name, slug, type, address, currency, timezone, logo_url, brand_color, created_by)
- `profiles` (id = auth.users.id, full_name, avatar_url, email)
- `memberships` (organization_id, profile_id, role user_role, status [invited/active], invited_email, unique(org,profile))
- `room_types` (name, base_price, capacity, beds, description)
- `rooms` (number, room_type_id, floor, status room_status, unique(org,number))
- `guests` (name, email, phone, city, preferences jsonb, notes, vip)
- `reservations` (guest_id, room_id, room_type_id, check_in, check_out, guests_count, status, source, total)
- `stays` (reservation_id, room_id, checked_in_at, checked_out_at)
- `payments` (invoice_id, amount, method, status, paid_at)
- `invoices` (reservation_id, guest_id, number, amount, tax/gst fields, status)
- `housekeeping_tasks` (room_id, assignee_membership_id, priority, status task_status, due_at, notes)
- `audit_logs` (organization_id, actor_profile_id, action, entity, entity_id, metadata jsonb)

Indexes on `organization_id` for every table + common filter columns (status, dates).

### RLS (`0002_rls.sql`)
- Enable RLS on all tables.
- Helper SQL: `is_org_member(org uuid)` and `has_org_role(org uuid, roles user_role[])` (security definer, query `memberships` by `auth.uid()`).
- Policy pattern per business table: `SELECT/INSERT/UPDATE/DELETE` allowed when `is_org_member(organization_id)`; destructive/financial ops further restricted via `has_org_role(...)`.
- `profiles`: self-read/update + visible to co-members. `organizations`: members read; OWNER/MANAGER update. `audit_logs`: insert by members, read by OWNER/MANAGER.

---

## Cross-cutting primitives

- **`lib/rbac.ts`** — `PERMISSIONS: Record<Role, Permission[]>` and `can(role, permission)`. Used in UI (hide actions) and server actions (enforce). Mirrors RLS.
- **`lib/auth.ts`** — `getCurrentUser()`, `getActiveOrg()` (active org from membership; stored in cookie/Zustand), `requireRole(roles)` throws/redirects.
- **`lib/errors.ts`** — `type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors? }`. All Server Actions return this.
- **Action pattern**: `"use server"` → authenticate → `requireRole` → Zod `safeParse` → service call → `writeAuditLog` → `revalidatePath` → return `ActionResult`.
- **`lib/audit.ts`** — every mutation logs to `audit_logs`.
- **Validation**: all inputs Zod-validated in `schemas/`; React Hook Form + `@hookform/resolvers/zod` on the client.

---

## Phase 1 implementation detail

**Auth** (`features/auth`): signup, login, logout, forgot-password, email verification via Supabase Auth; `middleware.ts` protects `(app)` routes and redirects unauthenticated users to `/login`; post-login users with no org → `/onboarding`.

**Organizations** (`features/organizations`): onboarding wizard (create hotel: name/type/address/currency/timezone/branding — mirrors prototype `onboarding.html`); staff list; **invite staff** (Resend email with token link → `api/invites/accept`); role assignment; OWNER/MANAGER-gated.

**Dashboard** (`features/dashboard`): Server Component fetching KPIs (occupancy %, revenue today, arrivals, departures), Recharts revenue/occupancy charts (Client Component), activity feed from `audit_logs`, room-status summary — visually matching prototype `index.html`.

**Shared UI** built first via shadcn/ui (button, input, card, table, dialog/sheet, dropdown, badge, form, select, tabs, sonner) + custom `AppShell/Sidebar/Topbar/KpiCard/StatusBadge/DataTable/EmptyState/ChartCard` reflecting the Linear/Attio/Vercel aesthetic and prototype design tokens (Inter, indigo `#4F46E5`, 12px radius, soft borders).

**Seed** (`supabase/seed.ts`): creates a demo org + memberships + room_types + rooms 101–150 + ~50 guests + ~30 reservations + tasks/invoices, run with `npx tsx supabase/seed.ts` using the service-role key.

---

## Build order within this execution

1. Scaffold Next.js app in `/app-next` (deps, TS, Tailwind v4, shadcn init, env files, `.gitignore`).
2. Write migrations `0001_init.sql` + `0002_rls.sql`; generate DB types (`supabase gen types`) into `types/database.ts`.
3. Supabase clients (`lib/supabase/*`) + `middleware.ts`.
4. Cross-cutting libs: `rbac`, `auth`, `errors`, `audit`, `validation`, Resend.
5. Shared UI components + AppShell.
6. Auth feature (pages + actions + schemas).
7. Organizations feature (onboarding, staff, invites).
8. Dashboard feature (queries + charts).
9. Stub Phases 2–5 features (folders, schemas, types, placeholder pages routed in sidebar).
10. Seed script.

---

## Verification

- `cd app-next && npm install` succeeds; `npm run build` and `npm run typecheck` (`tsc --noEmit`) pass with zero type errors.
- `npm run lint` clean.
- After user adds `.env.local` and applies migrations (via Supabase SQL editor or `supabase db push`) + runs the seed script:
  - `npm run dev` → sign up → email verify → onboarding creates an org → redirected to dashboard showing seeded KPIs/charts.
  - Invite a staff member (Resend email arrives in their dashboard/log); accept link creates an active membership with the assigned role.
  - RBAC check: log in as RECEPTIONIST → org settings/staff management actions hidden and rejected server-side.
  - RLS check: confirm a second org's data is not visible/mutable from the first org's session.
- Stub routes render placeholder pages without runtime errors.

## Notes / risks
- Cannot run end-to-end here until the user supplies `.env.local` and applies migrations — build/typecheck are the local gates.
- shadcn/ui + Tailwind v4 requires the canary CLI; pinned versions will be recorded in `package.json`.
- Email delivery requires a valid `RESEND_API_KEY`; without it, invites fall back to logging the invite link.

---

# Full Product Roadmap — All Phases

The first execution delivers **Foundation + Phase 1** (working) and scaffolds Phases 2–5 as typed stubs. This roadmap is the complete delivery plan across all phases. Every module follows the same architecture: feature folder (`components/ actions/ schemas/ services/ types/ hooks/`), Server Components by default, Server Actions returning `ActionResult<T>`, Zod validation, RBAC + RLS enforcement, and audit logging.

## Roles (RBAC)

| Role | Capabilities (mirrored in `lib/rbac.ts` + RLS) |
|------|------------------------------------------------|
| **OWNER** | Full access incl. org delete, billing, staff/roles |
| **MANAGER** | All operations + staff management + billing (no org delete) |
| **RECEPTIONIST** | Reservations, front desk, guests, reports |
| **HOUSEKEEPING** | Housekeeping tasks, room status |
| **ACCOUNTANT** | Billing, payments, reports |

## Phase 1 — Authentication, Organization, Dashboard ✅ (this build)

- **Authentication**: sign up, login, logout, forgot password, email verification, protected routes (middleware).
- **Organization**: create hotel (onboarding wizard), invite staff (Resend), staff management, role assignment.
- **Dashboard**: revenue & occupancy KPI cards, arrivals/departures today, activity feed (from `audit_logs`), revenue/occupancy charts (Recharts).

## Phase 2 — Rooms & Reservations

- **Rooms**: Room Types CRUD, Rooms CRUD, room status management (`AVAILABLE / OCCUPIED / RESERVED / CLEANING / MAINTENANCE`), floor management, card + grid views with filters.
- **Reservations**: create / edit / cancel reservation, availability check (no double-booking), calendar view, status lifecycle (`PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT`, plus `CANCELLED`), reservation detail drawer.

## Phase 3 — Front Desk & Guests

- **Front Desk**: check-in, check-out, walk-in booking, active stays board; quick-action cards; writes to `stays` and flips `rooms.status`.
- **Guests**: guest profiles (CRM), stay history, notes, preferences, profile drawer, search.

## Phase 4 — Billing & Housekeeping

- **Billing**: generate invoices, record payments, payment history, **GST support** (rate + amount on invoices), outstanding vs paid, revenue summary.
- **Housekeeping**: create tasks, assign to staff, update progress on a board (`PENDING / IN_PROGRESS / INSPECTION / COMPLETED`), priorities, due times.

## Phase 5 — Reports & Notifications

- **Reports**: revenue reports, occupancy reports, guest reports, ADR/RevPAR, channel breakdown, exportable; charts via Recharts.
- **Notifications**: in-app activity + email notifications via Resend (new reservation, payment received, check-in reminders, housekeeping alerts, weekly digest); user notification preferences in Settings.

## Cross-cutting (all phases)

- **Multi-tenancy**: every business table carries `organization_id`; **RLS** authorizes via `is_org_member` / `has_org_role`; app-layer RBAC mirrors it.
- **Security**: Row Level Security on all tables, protected routes, Zod-validated + sanitized inputs, audit logging to `audit_logs`.
- **Storage**: Supabase Storage for hotel logos and guest documents.
- **Settings** (tabbed): General, Hotel Profile, Staff, Roles, Billing, Notifications.
- **Responsive & accessible**: desktop full layout, tablet adaptive grids, mobile drawer nav; keyboard navigation; Inter font; Linear/Attio/Vercel-inspired enterprise UI.

## Database tables (all phases)

`organizations`, `profiles`, `memberships`, `room_types`, `rooms`, `guests`, `reservations`, `stays`, `payments`, `invoices`, `housekeeping_tasks`, `audit_logs` — see `supabase/migrations/0001_init.sql` (schema, enums, indexes) and `0002_rls.sql` (policies + helper functions).

## Deployment

Vercel (Next.js), Supabase (Postgres/Auth/Storage), Resend (email). Set the same env vars in the Vercel project as in `.env.local`.
