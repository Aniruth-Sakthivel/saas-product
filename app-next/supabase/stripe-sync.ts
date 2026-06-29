/**
 * Provisions Stripe products + monthly/yearly prices from the `plans` table and
 * writes the resulting ids back (stripe_product_id, stripe_price_*_id).
 * Idempotent: plans that already have a monthly price id are skipped.
 * Free plans (price_monthly = 0) are skipped. Run: npm run stripe:sync
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import Stripe from "stripe";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}
loadEnv();

const dbUrl = process.env.SUPABASE_DB_URL;
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!dbUrl) throw new Error("Missing SUPABASE_DB_URL in .env.local");
if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY in .env.local");

const stripe = new Stripe(stripeKey);

type PlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly: string;
  price_yearly: string;
  currency: string;
  stripe_price_monthly_id: string | null;
};

async function main() {
  const db = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await db.connect();

  const { rows } = await db.query<PlanRow>(
    "select id, code, name, description, price_monthly, price_yearly, currency, stripe_price_monthly_id from plans order by sort_order",
  );

  for (const plan of rows) {
    const monthly = Number(plan.price_monthly);
    if (monthly <= 0) {
      console.log(`· ${plan.code}: free plan, skipped`);
      continue;
    }
    if (plan.stripe_price_monthly_id) {
      console.log(`· ${plan.code}: already synced, skipped`);
      continue;
    }

    const currency = plan.currency.toLowerCase();
    const product = await stripe.products.create({
      name: `HotelOS ${plan.name}`,
      description: plan.description ?? undefined,
      metadata: { plan_code: plan.code },
    });
    const priceMonthly = await stripe.prices.create({
      product: product.id,
      currency,
      unit_amount: Math.round(monthly * 100),
      recurring: { interval: "month" },
      metadata: { plan_code: plan.code, interval: "MONTHLY" },
    });
    const priceYearly = await stripe.prices.create({
      product: product.id,
      currency,
      unit_amount: Math.round(Number(plan.price_yearly) * 100),
      recurring: { interval: "year" },
      metadata: { plan_code: plan.code, interval: "YEARLY" },
    });

    await db.query(
      `update plans set stripe_product_id = $1, stripe_price_monthly_id = $2,
       stripe_price_yearly_id = $3 where id = $4`,
      [product.id, priceMonthly.id, priceYearly.id, plan.id],
    );
    console.log(`✓ ${plan.code}: product ${product.id} (monthly ${priceMonthly.id}, yearly ${priceYearly.id})`);
  }

  await db.end();
  console.log("\n✅ Stripe products/prices synced.");
}

main().catch((err) => {
  console.error("stripe:sync failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
