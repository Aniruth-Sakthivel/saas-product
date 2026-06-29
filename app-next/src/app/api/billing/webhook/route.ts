import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/config/env";
import type { SubscriptionStatus } from "@/types/database";

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Maps a Stripe subscription status to our enum. */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

/** Updates the org's subscription row from a Stripe Subscription object. */
async function syncSubscription(sub: Stripe.Subscription) {
  const supabase = createAdminClient();
  const organizationId = sub.metadata?.organization_id;
  if (!organizationId) return;

  // Resolve our plan from the subscription's price id.
  const priceId = sub.items.data[0]?.price.id ?? null;
  let planId: string | undefined;
  if (priceId) {
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .or(`stripe_price_monthly_id.eq.${priceId},stripe_price_yearly_id.eq.${priceId}`)
      .maybeSingle();
    planId = plan?.id;
  }

  const item = sub.items.data[0];
  const interval = item?.price.recurring?.interval;
  // Stripe moved the billing period to the subscription item in recent versions.
  const periodEnd = item?.current_period_end ?? null;

  await supabase
    .from("subscriptions")
    .update({
      ...(planId ? { plan_id: planId } : {}),
      status: mapStatus(sub.status),
      interval: interval === "year" ? "YEARLY" : "MONTHLY",
      stripe_customer_id:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      trial_ends_at: sub.trial_end
        ? new Date(sub.trial_end * 1000).toISOString()
        : null,
    })
    .eq("organization_id", organizationId);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          // Carry org id onto the subscription so later events can resolve it.
          if (!sub.metadata?.organization_id && session.metadata?.organization_id) {
            sub.metadata = {
              ...sub.metadata,
              organization_id: session.metadata.organization_id,
            };
          }
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
