import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthenticationError, AuthorizationError } from "@/lib/errors";
import { hasAnyRole, can, type Permission } from "@/lib/rbac";
import { hasFeature, type FeatureKey } from "@/lib/entitlements";
import type {
  Membership,
  Organization,
  Profile,
  UserRole,
} from "@/types/database";

export const ACTIVE_ORG_COOKIE = "hotelos-active-org";

export interface ActiveContext {
  userId: string;
  profile: Profile | null;
  membership: Membership;
  organization: Organization;
}

/** Returns the authed Supabase user or null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Throws AuthenticationError when not signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/** All active memberships (with org) for the current user. */
export async function getMemberships(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("*, organization:organizations(*)")
    .eq("profile_id", userId)
    .eq("status", "ACTIVE");
  return (data ?? []) as Array<Membership & { organization: Organization }>;
}

/**
 * Resolves the active organization context for the current user, using the
 * active-org cookie when present, otherwise the first membership. Returns null
 * when the user has no organization (→ should be sent to onboarding).
 */
export async function getActiveContext(): Promise<ActiveContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await getMemberships(user.id);
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const preferredOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const selected =
    memberships.find((m) => m.organization_id === preferredOrg) ??
    memberships[0];

  const profile = await getProfile(user.id);

  return {
    userId: user.id,
    profile,
    membership: selected,
    organization: selected.organization,
  };
}

/** Like getActiveContext but redirects when missing auth/org. */
export async function requireActiveContext(): Promise<ActiveContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ctx = await getActiveContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}

/** Guard used inside Server Actions: throws when role is insufficient. */
export function assertRole(role: UserRole, allowed: UserRole[]) {
  if (!hasAnyRole(role, allowed)) throw new AuthorizationError();
}

/**
 * Page-level guard: resolves the active context and redirects to /dashboard
 * when the current role lacks `permission`. Mirrors the sidebar filtering so a
 * user can't reach a module by typing its URL directly.
 */
export async function requirePermission(
  permission: Permission,
): Promise<ActiveContext> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, permission)) redirect("/dashboard");
  return ctx;
}

/**
 * Like requireActiveContext but also requires the org's plan to include
 * `feature`. Redirects to the portal billing page when not entitled. Used to
 * gate product areas (e.g. CRM) behind an entitlement.
 */
export async function requireFeatureContext(
  feature: FeatureKey,
): Promise<ActiveContext> {
  const ctx = await requireActiveContext();
  const allowed = await hasFeature(ctx.organization.id, feature);
  if (!allowed) redirect("/portal/billing");
  return ctx;
}
