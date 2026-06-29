# Scaling Strategy

HotelOS follows one rule: **add infrastructure complexity only when a metric
demands it.** Today the platform is a modular monolith on a single Supabase
Postgres with an in-process cache — correct and cheapest for the current scale.
This document records the triggers and the ready-to-execute upgrades so scaling
is a deliberate, low-risk step rather than a rewrite.

## Current state
- **App:** single Next.js instance (Vercel) — stateless except the in-process cache.
- **DB:** one Supabase Postgres, multi-tenant by `organization_id`, RLS-enforced.
- **Cache:** in-process TTL map ([`src/lib/cache.ts`](../app-next/src/lib/cache.ts)),
  used for heavy cross-tenant admin aggregates (`admin:metrics`, `admin:analytics`).

## Triggers → action

| Trigger (sustained) | Action |
|---|---|
| App runs on >1 instance, or cache hit rate matters across instances | Swap the cache backend for **Redis** — implement `CacheBackend` against Redis and point `cache` at it. **No call-site changes** (everything uses `cached()`). |
| p95 API latency rising; repeated identical heavy reads | Widen `cached()` usage (plans catalog, portal product lists); add per-tenant cache keys + explicit invalidation on writes. |
| Slow writes block requests (emails, webhooks, exports, bulk ops) | Introduce a **queue (BullMQ on Redis)**. Move `notify()` sends, Stripe-driven side effects, and report generation to workers. The `notify()` interface already isolates delivery, so this is a backend swap. |
| Read load dominates (dashboards/analytics) and competes with writes | Add a **Postgres read replica**; route analytics/admin reads to it via a read-only client. |
| One product's load or data volume threatens others | Move that product to its **own schema**, then its own database. The `crm_*` prefix + `organization_id` boundary already make this a mechanical migration. |
| A single hot path needs independent scaling/deploys | Extract just that path into a **service**. Do **not** pre-split into microservices. |
| Cross-product code is copied between deploy targets | Extract `packages/` (auth, ui, db, types) into a **monorepo**. Deferred until a second deploy target exists. |

## Principles
- Measure first: every step above is justified by a metric, not anticipation.
- Keep changes mechanical: tenancy (`organization_id` + RLS), the `cached()`
  helper, and the `notify()` interface are seams designed so the upgrade is a
  backend swap, not a refactor.
- Each upgrade is independently reversible.
