import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth";

/**
 * Accepts a staff invitation. The invited user must be signed in with the
 * invited email; we then attach their profile to the membership and activate it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_invite`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Send them to sign up / log in, then back to this link.
    const redirectTo = encodeURIComponent(
      `/api/invites/accept?token=${token}`,
    );
    return NextResponse.redirect(
      `${origin}/signup?redirectedFrom=${redirectTo}`,
    );
  }

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("memberships")
    .select("*")
    .eq("invite_token", token)
    .eq("status", "INVITED")
    .maybeSingle();

  if (!invite) {
    return NextResponse.redirect(`${origin}/dashboard?invite=expired`);
  }

  if (
    invite.invited_email &&
    user.email &&
    invite.invited_email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return NextResponse.redirect(`${origin}/dashboard?invite=email_mismatch`);
  }

  // Ensure profile exists, then activate the membership.
  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? invite.invited_email ?? "",
      full_name: (user.user_metadata?.full_name as string) ?? null,
    },
    { onConflict: "id" },
  );

  await admin
    .from("memberships")
    .update({
      profile_id: user.id,
      status: "ACTIVE",
      invite_token: null,
    })
    .eq("id", invite.id);

  await admin.from("audit_logs").insert({
    organization_id: invite.organization_id,
    actor_profile_id: user.id,
    action: "staff.invite_accepted",
    entity: "membership",
    entity_id: invite.id,
    metadata: {},
  });

  const response = NextResponse.redirect(`${origin}/dashboard`);
  response.cookies.set(ACTIVE_ORG_COOKIE, invite.organization_id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
