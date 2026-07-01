import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Plan new organizations trial on, and how long the trial lasts. */
export const TRIAL_PLAN_CODE = "pro";
export const TRIAL_DAYS = 14;

/**
 * Creates a trial subscription for a freshly-created organization. The org gets
 * full features for the trial window (TRIALING counts as active in
 * `entitlements.ts`). No-op if a subscription already exists (org is unique).
 *
 * Must be called in a context where the current user is an active OWNER of the
 * org, so the RLS write policy on `subscriptions` permits the insert.
 */
export async function provisionTrialSubscription(
  organizationId: string,
  client?: SupabaseClient<Database>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = client ?? (await createClient());

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id")
    .eq("code", TRIAL_PLAN_CODE)
    .maybeSingle();
  if (planError) return { ok: false, error: planError.message };
  if (!plan) return { ok: false, error: `Trial plan '${TRIAL_PLAN_CODE}' not found.` };

  const trialEnd = new Date(
    Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("subscriptions").insert({
    organization_id: organizationId,
    plan_id: plan.id,
    status: "TRIALING",
    interval: "MONTHLY",
    trial_ends_at: trialEnd,
    current_period_end: trialEnd,
  });
  // Unique violation = subscription already exists; treat as success.
  if (error && error.code !== "23505") return { ok: false, error: error.message };

  return { ok: true };
}
