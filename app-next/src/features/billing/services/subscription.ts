import { createClient } from "@/lib/supabase/server";
import { getEntitlements, type ActiveEntitlements } from "@/lib/entitlements";
import type { Plan } from "@/types/database";

export type SubscriptionOverview = {
  entitlements: ActiveEntitlements | null;
  usage: { rooms: number; staff: number };
  trialDaysLeft: number | null;
  /** Purchasable (paid, active) plans, for upgrade options. */
  availablePlans: Plan[];
};

/** Days remaining until `trial_ends_at`, floored at 0; null when not trialing. */
function daysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** Subscription + current usage (rooms, active staff) for the billing panel. */
export async function getSubscriptionOverview(
  organizationId: string,
): Promise<SubscriptionOverview> {
  const supabase = await createClient();
  const entitlements = await getEntitlements(organizationId);

  const [rooms, staff, plans] = await Promise.all([
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "ACTIVE"),
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .gt("price_monthly", 0)
      .order("sort_order"),
  ]);

  return {
    entitlements,
    usage: { rooms: rooms.count ?? 0, staff: staff.count ?? 0 },
    trialDaysLeft:
      entitlements?.subscription.status === "TRIALING"
        ? daysLeft(entitlements.subscription.trial_ends_at)
        : null,
    availablePlans: (plans.data ?? []) as Plan[],
  };
}
