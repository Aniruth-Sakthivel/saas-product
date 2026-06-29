"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { requireActiveContext, assertRole } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/errors";
import { env } from "@/config/env";
import type { BillingInterval } from "@/types/database";

/**
 * Starts a Stripe Checkout session for the active organization to subscribe to
 * `planCode` on the given billing interval, then redirects to Stripe's hosted
 * checkout. OWNER-only. Re-uses the org's Stripe customer when one exists.
 */
export async function createCheckoutSessionAction(
  planCode: string,
  interval: BillingInterval,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  assertRole(ctx.membership.role, ["OWNER"]);

  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("code", planCode)
    .maybeSingle();
  if (!plan) return fail("Plan not found.");

  const priceId =
    interval === "YEARLY"
      ? plan.stripe_price_yearly_id
      : plan.stripe_price_monthly_id;
  if (!priceId) {
    return fail("This plan is not connected to Stripe yet. Run `npm run stripe:sync`.");
  }

  // Re-use an existing Stripe customer id from the org's subscription, if any.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  const stripe = getStripe();
  const billingBase = `${env.appUrl}/settings`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: existing?.stripe_customer_id ?? undefined,
    customer_email: existing?.stripe_customer_id ? undefined : ctx.profile?.email,
    client_reference_id: ctx.organization.id,
    subscription_data: {
      metadata: { organization_id: ctx.organization.id, plan_code: planCode },
    },
    metadata: { organization_id: ctx.organization.id, plan_code: planCode },
    success_url: `${billingBase}?billing=success`,
    cancel_url: `${billingBase}?billing=cancelled`,
  });

  if (!session.url) return fail("Could not start checkout.");
  redirect(session.url);
}
