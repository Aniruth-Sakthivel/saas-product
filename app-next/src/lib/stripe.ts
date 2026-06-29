import "server-only";
import Stripe from "stripe";
import { env } from "@/config/env";

/**
 * Server-only Stripe client. Reads STRIPE_SECRET_KEY lazily so the module can
 * be imported without the key present (e.g. during build); the key is only
 * required when an API call is actually made.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(env.stripeSecretKey, {
      appInfo: { name: "HotelOS", version: "0.1.0" },
    });
  }
  return client;
}
