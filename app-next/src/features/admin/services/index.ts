import { createAdminClient } from "@/lib/supabase/admin";
import { cached } from "@/lib/cache";
import type {
  Organization,
  Plan,
  Subscription,
  SubscriptionStatus,
} from "@/types/database";

export type AdminMetrics = {
  organizations: number;
  activeSubscriptions: number;
  trials: number;
  mrr: number; // sum of monthly price for ACTIVE subscriptions
  currency: string;
};

export type OrgRow = {
  organization: Organization;
  plan: Plan | null;
  status: SubscriptionStatus | null;
};

/** Platform-wide KPIs for the admin dashboard. Cached briefly (heavy scan). */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  return cached("admin:metrics", 30, computeAdminMetrics);
}

async function computeAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createAdminClient();
  const [{ count: orgCount }, subs, plans] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("plan_id, status"),
    supabase.from("plans").select("id, price_monthly, currency"),
  ]);

  const priceById = new Map(
    (plans.data ?? []).map((p) => [p.id, Number(p.price_monthly)]),
  );
  const rows = subs.data ?? [];
  const active = rows.filter((s) => s.status === "ACTIVE");
  const trials = rows.filter((s) => s.status === "TRIALING").length;
  const mrr = active.reduce((sum, s) => sum + (priceById.get(s.plan_id) ?? 0), 0);

  return {
    organizations: orgCount ?? 0,
    activeSubscriptions: active.length,
    trials,
    mrr,
    currency: (plans.data?.[0]?.currency ?? "USD") as string,
  };
}

/** Every organization with its current plan + subscription status. */
export async function listOrganizations(): Promise<OrgRow[]> {
  const supabase = createAdminClient();
  const [orgs, subs, plans] = await Promise.all([
    supabase.from("organizations").select("*").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*"),
    supabase.from("plans").select("*"),
  ]);

  const planById = new Map((plans.data ?? []).map((p) => [p.id, p as Plan]));
  const subByOrg = new Map(
    (subs.data ?? []).map((s) => [s.organization_id, s as Subscription]),
  );

  return (orgs.data ?? []).map((org) => {
    const sub = subByOrg.get(org.id);
    return {
      organization: org as Organization,
      plan: sub ? (planById.get(sub.plan_id) ?? null) : null,
      status: sub?.status ?? null,
    };
  });
}

/** All plans ordered for the catalog / admin management table. */
export async function listPlans(): Promise<Plan[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as Plan[];
}

export type OrgDetail = {
  organization: Organization;
  plan: Plan | null;
  subscription: Subscription | null;
  counts: { staff: number; rooms: number; reservations: number; guests: number };
  ownerEmail: string | null;
};

/** Full profile for a single tenant, for the admin org detail page. */
export async function getOrganizationDetail(
  organizationId: string,
): Promise<OrgDetail | null> {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();
  if (!org) return null;

  const [sub, staff, rooms, reservations, guests, owner] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase.from("profiles").select("email").eq("id", org.created_by).maybeSingle(),
  ]);

  let plan: Plan | null = null;
  if (sub.data) {
    const { data: p } = await supabase
      .from("plans")
      .select("*")
      .eq("id", sub.data.plan_id)
      .maybeSingle();
    plan = (p as Plan) ?? null;
  }

  return {
    organization: org as Organization,
    plan,
    subscription: (sub.data as Subscription) ?? null,
    counts: {
      staff: staff.count ?? 0,
      rooms: rooms.count ?? 0,
      reservations: reservations.count ?? 0,
      guests: guests.count ?? 0,
    },
    ownerEmail: owner.data?.email ?? null,
  };
}

/** Recent audit-log entries across all tenants, with org name + actor email. */
export async function recentAuditLogs(limit = 50) {
  const supabase = createAdminClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const orgIds = [...new Set((logs ?? []).map((l) => l.organization_id))];
  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_profile_id).filter(Boolean)),
  ] as string[];

  const [orgs, profiles] = await Promise.all([
    orgIds.length
      ? supabase.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    actorIds.length
      ? supabase.from("profiles").select("id, email").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; email: string }[] }),
  ]);

  const orgName = new Map((orgs.data ?? []).map((o) => [o.id, o.name]));
  const actorEmail = new Map((profiles.data ?? []).map((p) => [p.id, p.email]));

  return (logs ?? []).map((l) => ({
    ...l,
    organizationName: orgName.get(l.organization_id) ?? "—",
    actorEmail: l.actor_profile_id
      ? (actorEmail.get(l.actor_profile_id) ?? "—")
      : "system",
  }));
}
