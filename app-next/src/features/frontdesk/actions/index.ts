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

const checkInSchema = z.object({
  reservationId: z.string().uuid(),
  roomId: z.string().uuid(),
});

function revalidateOps() {
  revalidatePath("/frontdesk");
  revalidatePath("/rooms");
  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  revalidatePath("/housekeeping");
}

/**
 * Checks a guest in: assigns a physical room, marks the reservation CHECKED_IN,
 * flips the room to OCCUPIED, and opens a stay record. Keeps the Rooms board,
 * Bookings, and dashboard occupancy all in sync.
 */
export async function checkInAction(input: unknown): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, "frontdesk:operate")) {
    return fail("You don't have permission to operate the front desk.");
  }

  const parsed = parseInput(checkInSchema, input);
  if (!parsed.success) return parsed.result;
  const { reservationId, roomId } = parsed.data;

  const supabase = await createClient();
  const orgId = ctx.organization.id;

  const [{ data: reservation }, { data: room }] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, code, status, guest:guests(full_name)")
      .eq("id", reservationId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase
      .from("rooms")
      .select("id, number, status")
      .eq("id", roomId)
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);
  if (!reservation) return fail("Reservation not found.");
  if (!room) return fail("Room not found.");
  if (room.status !== "AVAILABLE")
    return fail(`Room ${room.number} is not available.`);
  if (reservation.status === "CHECKED_IN")
    return fail("This booking is already checked in.");

  const { error } = await supabase
    .from("reservations")
    .update({ status: "CHECKED_IN", room_id: roomId })
    .eq("id", reservationId)
    .eq("organization_id", orgId);
  if (error) return fail(error.message);

  await supabase
    .from("rooms")
    .update({ status: "OCCUPIED" })
    .eq("id", roomId)
    .eq("organization_id", orgId);

  await supabase.from("stays").insert({
    organization_id: orgId,
    reservation_id: reservationId,
    room_id: roomId,
    checked_in_at: new Date().toISOString(),
  });

  const guestName =
    (reservation as unknown as { guest: { full_name: string } | null }).guest
      ?.full_name ?? "Guest";

  await writeAuditLog({
    organizationId: orgId,
    actorProfileId: ctx.userId,
    action: "reservation.checked_in",
    entity: "reservation",
    entityId: reservationId,
    metadata: { code: reservation.code, room: room.number },
  });
  await createNotification(supabase, {
    organizationId: orgId,
    type: "frontdesk",
    title: `Checked in · ${reservation.code}`,
    body: `${guestName} checked into room ${room.number}.`,
    entity: "reservation",
    entityId: reservationId,
    metadata: { code: reservation.code, room: room.number, status: "CHECKED_IN" },
  });

  revalidateOps();
  return ok(undefined);
}

/**
 * Checks a guest out: marks the reservation CHECKED_OUT, closes the stay, and
 * sends the room to CLEANING with a housekeeping task so the room isn't re-sold
 * before it's serviced.
 */
export async function checkOutAction(input: unknown): Promise<ActionResult> {
  const ctx = await requireActiveContext();
  if (!can(ctx.membership.role, "frontdesk:operate")) {
    return fail("You don't have permission to operate the front desk.");
  }

  const parsed = parseInput(
    z.object({ reservationId: z.string().uuid() }),
    input,
  );
  if (!parsed.success) return parsed.result;
  const { reservationId } = parsed.data;

  const supabase = await createClient();
  const orgId = ctx.organization.id;

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, code, room_id, status, guest:guests(full_name), room:rooms(number)")
    .eq("id", reservationId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!reservation) return fail("Reservation not found.");
  if (reservation.status !== "CHECKED_IN")
    return fail("Only checked-in guests can be checked out.");

  const { error } = await supabase
    .from("reservations")
    .update({ status: "CHECKED_OUT" })
    .eq("id", reservationId)
    .eq("organization_id", orgId);
  if (error) return fail(error.message);

  const rel = reservation as unknown as {
    guest: { full_name: string } | null;
    room: { number: string } | null;
  };
  const roomNumber = rel.room?.number ?? "room";

  if (reservation.room_id) {
    await supabase
      .from("rooms")
      .update({ status: "CLEANING" })
      .eq("id", reservation.room_id)
      .eq("organization_id", orgId);
    await supabase
      .from("stays")
      .update({ checked_out_at: new Date().toISOString() })
      .eq("reservation_id", reservationId)
      .is("checked_out_at", null);
    await supabase.from("housekeeping_tasks").insert({
      organization_id: orgId,
      room_id: reservation.room_id,
      title: `Turnover clean · room ${roomNumber}`,
      priority: "HIGH",
      status: "PENDING",
    });
  }

  await writeAuditLog({
    organizationId: orgId,
    actorProfileId: ctx.userId,
    action: "reservation.checked_out",
    entity: "reservation",
    entityId: reservationId,
    metadata: { code: reservation.code, room: roomNumber },
  });
  await createNotification(supabase, {
    organizationId: orgId,
    type: "frontdesk",
    title: `Checked out · ${reservation.code}`,
    body: `${rel.guest?.full_name ?? "Guest"} checked out of room ${roomNumber}.`,
    entity: "reservation",
    entityId: reservationId,
    metadata: { code: reservation.code, room: roomNumber, status: "CHECKED_OUT" },
  });

  revalidateOps();
  return ok(undefined);
}
