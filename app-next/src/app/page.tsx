import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Root entry point. Signed-in users are routed into the app (`/dashboard`,
 * which itself forwards to onboarding/admin as needed); visitors see the public
 * landing page of the primary (first-created) hotel.
 */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("organizations")
    .select("slug")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data?.slug) redirect(`/hotel/${data.slug}`);
  redirect("/login");
}
