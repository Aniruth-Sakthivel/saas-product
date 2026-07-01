"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/admin";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { cache } from "@/lib/cache";
import {
  planSchema,
  setOrgStatusSchema,
  changeOrgPlanSchema,
} from "@/features/admin/schemas";

/** Drops the memoized cross-tenant aggregates so admin views refresh at once. */
async function invalidateAdminCaches() {
  await Promise.all([
    cache.del("admin:metrics"),
    cache.del("admin:analytics"),
  ]);
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/organizations");
  revalidatePath("/admin/plans");
}

/* ------------------------------------------------------------- plans CRUD */

export async function upsertPlanAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requirePlatformAdmin();

  const parsed = parseInput(planSchema, {
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    priceMonthly: formData.get("priceMonthly") ?? 0,
    priceYearly: formData.get("priceYearly") ?? 0,
    currency: formData.get("currency") ?? "USD",
    features: formData.get("features") ?? "",
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return parsed.result;
  const data = parsed.data;

  const features = data.features
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const supabase = createAdminClient();
  const row = {
    code: data.code,
    name: data.name,
    description: data.description || null,
    price_monthly: data.priceMonthly,
    price_yearly: data.priceYearly,
    currency: data.currency.toUpperCase(),
    features,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  };

  const { error } = data.id
    ? await supabase.from("plans").update(row).eq("id", data.id)
    : await supabase.from("plans").insert(row);
  if (error) return fail(error.message);

  await invalidateAdminCaches();
  revalidateAdmin();
  return ok(undefined);
}

export async function togglePlanActiveAction(
  planId: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requirePlatformAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("plans")
    .update({ is_active: isActive })
    .eq("id", planId);
  if (error) return fail(error.message);
  await invalidateAdminCaches();
  revalidateAdmin();
  return ok(undefined);
}

/* ----------------------------------------------------- organization admin */

export async function setOrgStatusAction(input: {
  organizationId: string;
  status: string;
}): Promise<ActionResult> {
  const adminId = await requirePlatformAdmin();
  const parsed = parseInput(setOrgStatusSchema, input);
  if (!parsed.success) return parsed.result;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: parsed.data.status })
    .eq("organization_id", parsed.data.organizationId);
  if (error) return fail(error.message);

  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    actorProfileId: adminId,
    action: "admin.subscription.status_changed",
    entity: "subscription",
    metadata: { status: parsed.data.status },
  });
  await invalidateAdminCaches();
  revalidateAdmin();
  revalidatePath(`/admin/organizations/${parsed.data.organizationId}`);
  return ok(undefined);
}

export async function changeOrgPlanAction(input: {
  organizationId: string;
  planId: string;
}): Promise<ActionResult> {
  const adminId = await requirePlatformAdmin();
  const parsed = parseInput(changeOrgPlanSchema, input);
  if (!parsed.success) return parsed.result;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("subscriptions")
        .update({ plan_id: parsed.data.planId })
        .eq("organization_id", parsed.data.organizationId)
    : await supabase.from("subscriptions").insert({
        organization_id: parsed.data.organizationId,
        plan_id: parsed.data.planId,
        status: "ACTIVE",
        interval: "MONTHLY",
      });
  if (error) return fail(error.message);

  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    actorProfileId: adminId,
    action: "admin.subscription.plan_changed",
    entity: "subscription",
    metadata: { planId: parsed.data.planId },
  });
  await invalidateAdminCaches();
  revalidateAdmin();
  revalidatePath(`/admin/organizations/${parsed.data.organizationId}`);
  return ok(undefined);
}

export async function deleteOrganizationAction(
  organizationId: string,
): Promise<ActionResult> {
  await requirePlatformAdmin();
  const supabase = createAdminClient();
  // FK cascades remove memberships, rooms, reservations, subscriptions, etc.
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", organizationId);
  if (error) return fail(error.message);

  await invalidateAdminCaches();
  revalidateAdmin();
  return ok(undefined);
}
