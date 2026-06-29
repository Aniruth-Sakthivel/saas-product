"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireFeatureContext } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { createContactSchema, createDealSchema } from "@/features/crm/schemas";

export async function createContactAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireFeatureContext("crm");
  const parsed = parseInput(createContactSchema, {
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    title: formData.get("title") ?? "",
    companyName: formData.get("companyName") ?? "",
  });
  if (!parsed.success) return parsed.result;

  const supabase = await createClient();

  // Find or create the company by name, if one was provided.
  let companyId: string | null = null;
  if (parsed.data.companyName) {
    const { data: existing } = await supabase
      .from("crm_companies")
      .select("id")
      .eq("organization_id", ctx.organization.id)
      .eq("name", parsed.data.companyName)
      .maybeSingle();
    if (existing) {
      companyId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("crm_companies")
        .insert({ organization_id: ctx.organization.id, name: parsed.data.companyName })
        .select("id")
        .single();
      if (error) return fail(error.message);
      companyId = created.id;
    }
  }

  const { error } = await supabase.from("crm_contacts").insert({
    organization_id: ctx.organization.id,
    company_id: companyId,
    full_name: parsed.data.fullName,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    title: parsed.data.title || null,
  });
  if (error) return fail(error.message);

  await writeAuditLog({
    organizationId: ctx.organization.id,
    actorProfileId: ctx.userId,
    action: "crm.contact_created",
    entity: "crm_contact",
    metadata: { name: parsed.data.fullName },
  });

  revalidatePath("/crm/contacts");
  return ok(undefined);
}

export async function createDealAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireFeatureContext("crm");
  const parsed = parseInput(createDealSchema, {
    title: formData.get("title"),
    value: formData.get("value") ?? 0,
    stage: formData.get("stage") ?? "LEAD",
  });
  if (!parsed.success) return parsed.result;

  const supabase = await createClient();
  const { error } = await supabase.from("crm_deals").insert({
    organization_id: ctx.organization.id,
    title: parsed.data.title,
    value: parsed.data.value,
    stage: parsed.data.stage,
    owner_membership_id: ctx.membership.id,
  });
  if (error) return fail(error.message);

  await writeAuditLog({
    organizationId: ctx.organization.id,
    actorProfileId: ctx.userId,
    action: "crm.deal_created",
    entity: "crm_deal",
    metadata: { title: parsed.data.title, value: parsed.data.value },
  });

  revalidatePath("/crm/deals");
  return ok(undefined);
}
