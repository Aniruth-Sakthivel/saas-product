"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveContext } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

const statusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["PENDING", "IN_PROGRESS", "INSPECTION", "COMPLETED"]),
});

/**
 * Advances a housekeeping task. When a task is COMPLETED and its room was in
 * CLEANING, the room is released back to AVAILABLE — closing the loop between
 * the Front Desk, Rooms board, and Housekeeping.
 */
export async function updateTaskStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, "housekeeping:manage")) {
    return fail("You don't have permission to manage housekeeping.");
  }

  const parsed = parseInput(statusSchema, input);
  if (!parsed.success) return parsed.result;
  const { taskId, status } = parsed.data;

  const supabase = await createClient();
  const orgId = ctx.organization.id;

  const { data: task } = await supabase
    .from("housekeeping_tasks")
    .select("id, room_id, title")
    .eq("id", taskId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!task) return fail("Task not found.");

  const { error } = await supabase
    .from("housekeeping_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("organization_id", orgId);
  if (error) return fail(error.message);

  if (status === "COMPLETED" && task.room_id) {
    await supabase
      .from("rooms")
      .update({ status: "AVAILABLE" })
      .eq("id", task.room_id)
      .eq("organization_id", orgId)
      .eq("status", "CLEANING");
  }

  await writeAuditLog({
    organizationId: orgId,
    actorProfileId: ctx.userId,
    action: "housekeeping.status_changed",
    entity: "housekeeping_task",
    entityId: taskId,
    metadata: { title: task.title, status },
  });

  revalidatePath("/housekeeping");
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  return ok(undefined);
}

const createSchema = z.object({
  roomId: z.string().uuid().optional(),
  title: z.string().min(2, "Enter a task title."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

/** Creates an ad-hoc housekeeping task. */
export async function createTaskAction(input: unknown): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, "housekeeping:manage")) {
    return fail("You don't have permission to manage housekeeping.");
  }

  const parsed = parseInput(createSchema, input);
  if (!parsed.success) return parsed.result;
  const { roomId, title, priority } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("housekeeping_tasks").insert({
    organization_id: ctx.organization.id,
    room_id: roomId ?? null,
    title,
    priority,
    status: "PENDING",
  });
  if (error) return fail(error.message);

  revalidatePath("/housekeeping");
  return ok(undefined);
}
