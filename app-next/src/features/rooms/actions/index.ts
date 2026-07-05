"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveContext } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  roomId: z.string().uuid(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE"]),
});

/**
 * Updates a physical room's status from the Rooms board. When a room is set to
 * CLEANING it also spawns a housekeeping task, keeping the two boards in sync.
 */
export async function updateRoomStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, "rooms:manage")) {
    return fail("You don't have permission to manage rooms.");
  }

  const parsed = parseInput(schema, input);
  if (!parsed.success) return parsed.result;
  const { roomId, status } = parsed.data;

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, number")
    .eq("id", roomId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();
  if (!room) return fail("Room not found.");

  const { error } = await supabase
    .from("rooms")
    .update({ status })
    .eq("id", roomId)
    .eq("organization_id", ctx.organization.id);
  if (error) return fail(error.message);

  // Auto-create a cleaning task so Housekeeping picks it up.
  if (status === "CLEANING") {
    await supabase.from("housekeeping_tasks").insert({
      organization_id: ctx.organization.id,
      room_id: roomId,
      title: `Clean room ${room.number}`,
      priority: "MEDIUM",
      status: "PENDING",
    });
  }

  await writeAuditLog({
    organizationId: ctx.organization.id,
    actorProfileId: ctx.userId,
    action: "room.status_changed",
    entity: "room",
    entityId: roomId,
    metadata: { number: room.number, status },
  });

  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/housekeeping");
  return ok(undefined);
}
