import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Service-role client — bypasses RLS. Server-only. Use sparingly for
 * privileged operations (invites acceptance, seeding, webhooks).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
