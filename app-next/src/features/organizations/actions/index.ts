"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ACTIVE_ORG_COOKIE,
  requireActiveContext,
  requireUser,
} from "@/lib/auth";
import { assertRole } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { env } from "@/config/env";
import { slugify } from "@/lib/utils";
import { provisionTrialSubscription } from "@/lib/subscriptions";
import { ROLE_LABELS } from "@/lib/rbac";
import {
  createOrganizationSchema,
  inviteStaffSchema,
  removeMembershipSchema,
  updateRoleSchema,
} from "@/features/organizations/schemas";

export async function createOrganizationAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = parseInput(createOrganizationSchema, {
    name: formData.get("name"),
    type: formData.get("type"),
    address: formData.get("address") ?? "",
    currency: formData.get("currency") ?? "USD",
    timezone: formData.get("timezone") ?? "UTC",
    brandColor: formData.get("brandColor") ?? "#4F46E5",
    rooms: formData.get("rooms") ?? 0,
    floors: formData.get("floors") ?? 0,
  });
  if (!parsed.success) return parsed.result;

  // Onboarding is a privileged bootstrap: the user has no organization or
  // membership yet, so RLS policies that authorize via membership can't apply.
  // Use the service-role client for these first writes (safe: the user is
  // authenticated and we set created_by / profile_id to their own id).
  const supabase = createAdminClient();

  // Ensure a profile row exists (covers signups created before the trigger).
  await supabase
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? "", full_name: user.user_metadata?.full_name ?? null },
      { onConflict: "id" },
    );

  const slug = `${slugify(parsed.data.name)}-${randomUUID().slice(0, 6)}`;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug,
      type: parsed.data.type,
      address: parsed.data.address,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      brand_color: parsed.data.brandColor,
      created_by: user.id,
    })
    .select()
    .single();

  if (orgError || !org) return fail(orgError?.message ?? "Could not create hotel.");

  const { error: memberError } = await supabase.from("memberships").insert({
    organization_id: org.id,
    profile_id: user.id,
    role: "OWNER",
    status: "ACTIVE",
  });
  if (memberError) return fail(memberError.message);

  // Start a trial subscription so the org has real entitlements from day one.
  const trial = await provisionTrialSubscription(org.id, supabase);
  if (!trial.ok) return fail(trial.error);

  await writeAuditLog({
    organizationId: org.id,
    actorProfileId: user.id,
    action: "organization.created",
    entity: "organization",
    entityId: org.id,
    metadata: { name: org.name },
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, org.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function inviteStaffAction(
  _prev: ActionResult<{ delivered: boolean; url: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ delivered: boolean; url: string }>> {
  const ctx = await requireActiveContext();
  assertRole(ctx.membership.role, ["OWNER", "MANAGER"]);

  const parsed = parseInput(inviteStaffSchema, {
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return parsed.result;

  const supabase = await createClient();
  const token = randomUUID();

  const { error } = await supabase.from("memberships").insert({
    organization_id: ctx.organization.id,
    profile_id: null,
    role: parsed.data.role,
    status: "INVITED",
    invited_email: parsed.data.email,
    invite_token: token,
    invited_by: ctx.userId,
  });
  if (error) return fail(error.message);

  const acceptUrl = `${env.appUrl}/api/invites/accept?token=${token}`;
  const results = await notify({
    to: { email: parsed.data.email },
    template: "staff_invite",
    data: {
      organizationName: ctx.organization.name,
      inviterName: ctx.profile?.full_name ?? "A teammate",
      role: ROLE_LABELS[parsed.data.role],
      acceptUrl,
    },
  });
  const delivered = results.some((r) => r.delivered);

  await writeAuditLog({
    organizationId: ctx.organization.id,
    actorProfileId: ctx.userId,
    action: "staff.invited",
    entity: "membership",
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/settings");
  return ok({ delivered, url: acceptUrl });
}

export async function updateMembershipRoleAction(
  membershipId: string,
  role: string,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  assertRole(ctx.membership.role, ["OWNER", "MANAGER"]);

  const parsed = parseInput(updateRoleSchema, { membershipId, role });
  if (!parsed.success) return parsed.result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId)
    .eq("organization_id", ctx.organization.id);
  if (error) return fail(error.message);

  await writeAuditLog({
    organizationId: ctx.organization.id,
    actorProfileId: ctx.userId,
    action: "staff.role_updated",
    entity: "membership",
    entityId: parsed.data.membershipId,
    metadata: { role: parsed.data.role },
  });

  revalidatePath("/settings");
  return ok(undefined);
}

export async function removeMembershipAction(
  membershipId: string,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  assertRole(ctx.membership.role, ["OWNER", "MANAGER"]);

  const parsed = parseInput(removeMembershipSchema, { membershipId });
  if (!parsed.success) return parsed.result;

  if (parsed.data.membershipId === ctx.membership.id) {
    return fail("You can't remove your own membership.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", parsed.data.membershipId)
    .eq("organization_id", ctx.organization.id);
  if (error) return fail(error.message);

  await writeAuditLog({
    organizationId: ctx.organization.id,
    actorProfileId: ctx.userId,
    action: "staff.removed",
    entity: "membership",
    entityId: parsed.data.membershipId,
  });

  revalidatePath("/settings");
  return ok(undefined);
}
