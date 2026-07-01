"use server";

import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import {
  getHotelBySlug,
  getAvailability,
  type AvailabilityResult,
} from "@/features/booking/services/public";
import { quote, TAX_RATE } from "@/features/booking/lib/pricing";
import {
  availabilitySearchSchema,
  publicBookingSchema,
} from "@/features/booking/schemas";

/** Searches availability for a hotel (public, unauthenticated). */
export async function searchAvailabilityAction(
  slug: string,
  input: unknown,
): Promise<ActionResult<AvailabilityResult[]>> {
  const parsed = parseInput(availabilitySearchSchema, input);
  if (!parsed.success) return parsed.result;

  const hotel = await getHotelBySlug(slug);
  if (!hotel) return fail("Hotel not found.");

  const results = await getAvailability(hotel.id, parsed.data);
  return ok(results);
}

export interface BookingConfirmation {
  code: string;
  hotelName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  currency: string;
  guestEmail: string;
  invoiceNumber: string;
  emailed: boolean;
}

/**
 * Creates a reservation from the public booking flow. Runs with the
 * service-role client (the guest has no account); the org is resolved from the
 * public slug and availability is re-checked server-side to prevent overselling
 * or tampering with the posted price. No room is assigned yet — the front desk
 * assigns a physical room at check-in.
 */
export async function createPublicBookingAction(
  slug: string,
  input: unknown,
): Promise<ActionResult<BookingConfirmation>> {
  const parsed = parseInput(publicBookingSchema, input);
  if (!parsed.success) return parsed.result;
  const data = parsed.data;

  const hotel = await getHotelBySlug(slug);
  if (!hotel) return fail("Hotel not found.");

  // Re-check availability + price on the server; never trust the client.
  const results = await getAvailability(hotel.id, {
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    guests: data.guests,
    roomTypeId: data.roomTypeId,
  });
  const match = results.find((r) => r.roomType.id === data.roomTypeId);
  if (!match) return fail("That room type is not available for your dates.");
  if (match.availableRooms < 1)
    return fail("Sorry, that room type just sold out for your dates.");

  const server = quote(match.roomType.base_price, match.quote.nights);
  const supabase = createAdminClient();

  // Reuse an existing guest for this org by email, else create one.
  let guestId: string | null = null;
  if (data.email) {
    const { data: existing } = await supabase
      .from("guests")
      .select("id")
      .eq("organization_id", hotel.id)
      .eq("email", data.email)
      .maybeSingle();
    guestId = existing?.id ?? null;
  }
  if (!guestId) {
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        organization_id: hotel.id,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        city: data.city || null,
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (guestError || !guest) return fail("Could not save guest details.");
    guestId = guest.id;
  }

  const code = `BK-${randomUUID().slice(0, 8).toUpperCase()}`;
  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .insert({
      organization_id: hotel.id,
      code,
      guest_id: guestId,
      room_type_id: data.roomTypeId,
      check_in: data.checkIn,
      check_out: data.checkOut,
      guests_count: data.guests,
      status: "PENDING",
      source: "Website",
      total: server.total,
    })
    .select("id, code")
    .single();
  if (resError || !reservation)
    return fail(resError?.message ?? "Could not create your reservation.");

  // Generate an invoice so the booking shows up in the tenant's billing.
  const invoiceNumber = `INV-${reservation.code}`;
  await supabase.from("invoices").insert({
    organization_id: hotel.id,
    number: invoiceNumber,
    reservation_id: reservation.id,
    guest_id: guestId,
    subtotal: server.subtotal,
    gst_rate: TAX_RATE * 100,
    gst_amount: server.taxes,
    total: server.total,
    status: "PENDING",
  });

  // Audit log via the service-role client — a public visitor has no session,
  // so the RLS-gated writeAuditLog() would be silently dropped otherwise.
  await supabase.from("audit_logs").insert({
    organization_id: hotel.id,
    action: "reservation.created",
    entity: "reservation",
    entity_id: reservation.id,
    metadata: {
      source: "Website",
      code: reservation.code,
      email: data.email,
      invoiceNumber,
    },
  });

  // Send the confirmation + invoice email to the guest.
  const emailResults = await notify({
    to: { email: data.email },
    template: "booking_confirmation",
    data: {
      hotelName: hotel.name,
      guestName: data.fullName,
      code: reservation.code,
      roomTypeName: match.roomType.name,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: server.nights,
      guests: data.guests,
      currency: hotel.currency,
      nightlyRate: match.roomType.base_price,
      subtotal: server.subtotal,
      taxes: server.taxes,
      total: server.total,
      invoiceNumber,
    },
  });
  const emailed = emailResults.some((r) => r.delivered);

  return ok({
    code: reservation.code,
    hotelName: hotel.name,
    roomTypeName: match.roomType.name,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    guests: data.guests,
    nights: server.nights,
    total: server.total,
    currency: hotel.currency,
    guestEmail: data.email,
    invoiceNumber,
    emailed,
  });
}
