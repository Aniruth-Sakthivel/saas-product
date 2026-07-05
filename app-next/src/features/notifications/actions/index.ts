"use server";

import { createClient } from "@/lib/supabase/server";
import { requireActiveContext } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/errors";

/** Marks a single notification as read (org-scoped via RLS). */
export async function markNotificationReadAction(
  id: string,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("organization_id", ctx.organization.id);
  if (error) return fail(error.message);
  return ok(undefined);
}

/** Marks every unread notification for the active org as read. */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("organization_id", ctx.organization.id)
    .eq("read", false);
  if (error) return fail(error.message);
  return ok(undefined);
}
