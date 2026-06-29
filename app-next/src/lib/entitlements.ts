import { createClient } from "@/lib/supabase/server";
import type { Plan, Subscription } from "@/types/database";

/**
 * Feature keys gate product capabilities by plan. Mirrors the `features` array
 * stored on each `plans` row. Keep this union in sync with the seed in
 * supabase/migrations/0005_billing.sql.
 */
export type FeatureKey =
  | "hotel"
  | "reports.advanced"
  | "analytics"
  | "crm";

/** Numeric usage caps; `null` (or absent) means unlimited. */
export type LimitKey = "rooms" | "staff";

/** Subscription statuses that grant access to a plan's entitlements. */
const ACTIVE_STATUSES = ["TRIALING", "ACTIVE"] as const;

export type ActiveEntitlements = {
  subscription: Subscription;
  plan: Plan;
  features: Set<FeatureKey>;
  limits: Partial<Record<LimitKey, number | null>>;
  isActive: boolean;
};

/**
 * Loads the organization's subscription + plan and resolves its entitlements.
 * Returns null when the org has no subscription row at all.
 */
export async function getEntitlements(
  organizationId: string,
): Promise<ActiveEntitlements | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;
  const { plan, ...subscription } = data as unknown as Subscription & {
    plan: Plan;
  };
  if (!plan) return null;

  const isActive = (ACTIVE_STATUSES as readonly string[]).includes(
    subscription.status,
  );
  const features = new Set(
    (Array.isArray(plan.features) ? plan.features : []) as FeatureKey[],
  );

  return {
    subscription,
    plan,
    features,
    limits: (plan.limits ?? {}) as Partial<Record<LimitKey, number | null>>,
    isActive,
  };
}

/**
 * True when the organization's active subscription includes `feature`.
 * The keystone entitlement check used across the app and future products.
 */
export async function hasFeature(
  organizationId: string,
  feature: FeatureKey,
): Promise<boolean> {
  const ent = await getEntitlements(organizationId);
  return !!ent && ent.isActive && ent.features.has(feature);
}

/**
 * Resolves the numeric limit for `key`. Returns `null` for unlimited (or when
 * the org has no active plan, callers should treat null per their own policy).
 */
export async function getLimit(
  organizationId: string,
  key: LimitKey,
): Promise<number | null> {
  const ent = await getEntitlements(organizationId);
  const value = ent?.limits?.[key];
  return value ?? null;
}

/**
 * True when adding more of `key` would exceed the plan limit. `null` limit
 * (unlimited) always returns false.
 */
export async function isWithinLimit(
  organizationId: string,
  key: LimitKey,
  currentCount: number,
): Promise<boolean> {
  const limit = await getLimit(organizationId, key);
  if (limit === null) return true;
  return currentCount < limit;
}
