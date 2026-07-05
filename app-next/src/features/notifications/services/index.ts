import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json, Notification } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface CreateNotificationInput {
  organizationId: string;
  title: string;
  body?: string | null;
  type?: string;
  entity?: string | null;
  entityId?: string | null;
  metadata?: Json;
}

/**
 * Inserts an in-app notification for an organization. Accepts any Supabase
 * client so it works from privileged public flows (service-role admin client)
 * and from authenticated admin actions (RLS server client) alike. Best-effort —
 * a failed notification never breaks the surrounding booking flow.
 */
export async function createNotification(
  client: Client,
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await client.from("notifications").insert({
      organization_id: input.organizationId,
      type: input.type ?? "booking",
      title: input.title,
      body: input.body ?? null,
      entity: input.entity ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error("[notifications] failed to create notification", err);
  }
}

/** Most recent notifications for an org (newest first). */
export async function listNotifications(
  organizationId: string,
  limit = 20,
): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Notification[];
}
