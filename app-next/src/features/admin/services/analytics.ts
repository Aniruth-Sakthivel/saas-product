import { createAdminClient } from "@/lib/supabase/admin";
import { cached } from "@/lib/cache";
import type { SubscriptionStatus } from "@/types/database";

export type NameValue = { name: string; value: number };

export type PlatformAnalytics = {
  planDistribution: NameValue[];
  statusBreakdown: NameValue[];
  orgGrowth: NameValue[]; // new orgs per month, last 6 months
  churnRate: number; // canceled / (active + trialing + canceled)
};

function monthKey(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/** Cross-tenant analytics for the admin Analytics page. Cached briefly. */
export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  return cached("admin:analytics", 30, computePlatformAnalytics);
}

async function computePlatformAnalytics(): Promise<PlatformAnalytics> {
  const supabase = createAdminClient();
  const [orgs, subs, plans] = await Promise.all([
    supabase.from("organizations").select("created_at"),
    supabase.from("subscriptions").select("plan_id, status"),
    supabase.from("plans").select("id, name"),
  ]);

  const planName = new Map((plans.data ?? []).map((p) => [p.id, p.name]));
  const subRows = subs.data ?? [];

  // Plan distribution
  const planCounts = new Map<string, number>();
  for (const s of subRows) {
    const name = planName.get(s.plan_id) ?? "Unknown";
    planCounts.set(name, (planCounts.get(name) ?? 0) + 1);
  }
  const planDistribution = [...planCounts].map(([name, value]) => ({ name, value }));

  // Status breakdown
  const statusCounts = new Map<SubscriptionStatus, number>();
  for (const s of subRows) {
    statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1);
  }
  const statusBreakdown = [...statusCounts].map(([name, value]) => ({ name, value }));

  // Org growth — last 6 months
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    buckets.set(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)), 0);
  }
  for (const o of orgs.data ?? []) {
    const key = monthKey(new Date(o.created_at));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const orgGrowth = [...buckets].map(([name, value]) => ({ name, value }));

  // Churn
  const active = statusCounts.get("ACTIVE") ?? 0;
  const trialing = statusCounts.get("TRIALING") ?? 0;
  const canceled = statusCounts.get("CANCELED") ?? 0;
  const denom = active + trialing + canceled;
  const churnRate = denom === 0 ? 0 : Math.round((canceled / denom) * 100);

  return { planDistribution, statusBreakdown, orgGrowth, churnRate };
}
