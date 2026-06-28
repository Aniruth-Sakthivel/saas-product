import { createClient } from "@/lib/supabase/server";
import type { Membership, Profile } from "@/types/database";

export type StaffMember = Membership & { profile: Profile | null };

/** Lists staff (memberships + profiles) for an organization. */
export async function listStaff(organizationId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("*, profile:profiles(*)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  return (data ?? []) as StaffMember[];
}
