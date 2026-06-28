import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

interface AuditInput {
  organizationId: string;
  actorProfileId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Json;
}

/** Best-effort audit log write. Never throws into the calling action. */
export async function writeAuditLog(input: AuditInput) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      organization_id: input.organizationId,
      actor_profile_id: input.actorProfileId ?? null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}
