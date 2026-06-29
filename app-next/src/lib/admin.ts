import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** True when the given user is on the platform_admins allowlist. */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("platform_admins")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();
  return !!data;
}

/**
 * Guard for admin routes. Redirects unauthenticated users to /login and
 * non-admins to /dashboard. Returns the admin user id when allowed.
 */
export async function requirePlatformAdmin(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await isPlatformAdmin(user.id))) redirect("/dashboard");
  return user.id;
}
