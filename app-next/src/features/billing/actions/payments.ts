"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveContext } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/features/notifications/services";

const schema = z.object({
  invoiceId: z.string().uuid(),
  method: z
    .enum(["CARD", "CASH", "BANK_TRANSFER", "UPI", "PAYPAL", "OTHER"])
    .default("CARD"),
});

/**
 * Records full payment against an invoice: inserts a PAID payment for the
 * invoice total and marks the invoice PAID. Feeds dashboard revenue and the
 * Reports module immediately.
 */
export async function recordPaymentAction(
  input: unknown,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, "billing:manage")) {
    return fail("You don't have permission to manage billing.");
  }

  const parsed = parseInput(schema, input);
  if (!parsed.success) return parsed.result;
  const { invoiceId, method } = parsed.data;

  const supabase = await createClient();
  const orgId = ctx.organization.id;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, number, total, status")
    .eq("id", invoiceId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!invoice) return fail("Invoice not found.");
  if (invoice.status === "PAID") return fail("Invoice is already paid.");

  const { error: payError } = await supabase.from("payments").insert({
    organization_id: orgId,
    invoice_id: invoiceId,
    amount: invoice.total,
    method,
    status: "PAID",
    paid_at: new Date().toISOString(),
  });
  if (payError) return fail(payError.message);

  const { error } = await supabase
    .from("invoices")
    .update({ status: "PAID" })
    .eq("id", invoiceId)
    .eq("organization_id", orgId);
  if (error) return fail(error.message);

  await writeAuditLog({
    organizationId: orgId,
    actorProfileId: ctx.userId,
    action: "invoice.paid",
    entity: "invoice",
    entityId: invoiceId,
    metadata: { number: invoice.number, amount: invoice.total, method },
  });
  await createNotification(supabase, {
    organizationId: orgId,
    type: "billing",
    title: `Payment received · ${invoice.number}`,
    body: `Invoice ${invoice.number} marked paid (${method}).`,
    entity: "invoice",
    entityId: invoiceId,
    metadata: { number: invoice.number, amount: invoice.total, method },
  });

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return ok(undefined);
}
