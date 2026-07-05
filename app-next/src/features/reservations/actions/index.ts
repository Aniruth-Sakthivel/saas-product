"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveContext } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/features/notifications/services";
import type { ReservationStatus, RoomStatus } from "@/types/database";

const statusSchema = z.object({
  reservationId: z.string().uuid(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "CHECKED_IN",
    "CHECKED_OUT",
    "CANCELLED",
  ]),
});

/** Room status that an assigned physical room should take for a given stage. */
const ROOM_STATUS_FOR: Partial<Record<ReservationStatus, RoomStatus>> = {
  CONFIRMED: "RESERVED",
  CHECKED_IN: "OCCUPIED",
  CHECKED_OUT: "AVAILABLE",
  CANCELLED: "AVAILABLE",
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
};

/**
 * Updates a reservation's status from the admin panel. Keeps room occupancy in
 * sync (when a physical room is assigned), writes an audit entry, and emits a
 * realtime admin notification so every open panel updates immediately.
 */
export async function updateReservationStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, "reservations:manage")) {
    return fail("You don't have permission to manage reservations.");
  }

  const parsed = parseInput(statusSchema, input);
  if (!parsed.success) return parsed.result;
  const { reservationId, status } = parsed.data;

  const supabase = await createClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, code, room_id, status, room_type:room_types(name), guest:guests(full_name)")
    .eq("id", reservationId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();
  if (!reservation) return fail("Reservation not found.");

  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId)
    .eq("organization_id", ctx.organization.id);
  if (error) return fail(error.message);

  // Keep the assigned physical room's status in sync with the stay lifecycle.
  const roomStatus = ROOM_STATUS_FOR[status];
  if (reservation.room_id && roomStatus) {
    await supabase
      .from("rooms")
      .update({ status: roomStatus })
      .eq("id", reservation.room_id)
      .eq("organization_id", ctx.organization.id);
  }

  const rel = reservation as unknown as {
    room_type: { name: string } | null;
    guest: { full_name: string } | null;
  };
  const guestName = rel.guest?.full_name ?? "Guest";
  const roomTypeName = rel.room_type?.name ?? "room";

  await writeAuditLog({
    organizationId: ctx.organization.id,
    actorProfileId: ctx.userId,
    action: "reservation.status_changed",
    entity: "reservation",
    entityId: reservationId,
    metadata: { code: reservation.code, from: reservation.status, to: status },
  });

  await createNotification(supabase, {
    organizationId: ctx.organization.id,
    type: "booking",
    title: `Booking ${STATUS_LABELS[status].toLowerCase()} · ${reservation.code}`,
    body: `${guestName}'s ${roomTypeName} booking is now ${STATUS_LABELS[status]}.`,
    entity: "reservation",
    entityId: reservationId,
    metadata: { code: reservation.code, status, guestName, roomType: roomTypeName },
  });

  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  return ok(undefined);
}
