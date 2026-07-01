import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organization, RoomType } from "@/types/database";
import { nightsBetween, quote, type Quote } from "@/features/booking/lib/pricing";

/**
 * Public (unauthenticated) reads for the guest-facing landing + booking pages.
 * Visitors have no session, so RLS can't authorize them — we use the
 * service-role client and hard-scope every query to a single organization
 * resolved from the public `slug`. Read-only, public-safe fields only.
 */

/** Curated presentational content is keyed off the room type name. */
export interface RoomTypeCard extends RoomType {
  totalRooms: number;
}

/** Resolves a hotel by its public slug, or null when not found. */
export async function getHotelBySlug(
  slug: string,
): Promise<Organization | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Organization) ?? null;
}

/** Room types for a hotel, with how many physical rooms exist of each type. */
export async function getRoomTypes(
  organizationId: string,
): Promise<RoomTypeCard[]> {
  const supabase = createAdminClient();
  const [{ data: types }, { data: rooms }] = await Promise.all([
    supabase
      .from("room_types")
      .select("*")
      .eq("organization_id", organizationId)
      .order("base_price", { ascending: true }),
    supabase
      .from("rooms")
      .select("id, room_type_id")
      .eq("organization_id", organizationId),
  ]);

  const counts = new Map<string, number>();
  for (const r of rooms ?? []) {
    if (r.room_type_id)
      counts.set(r.room_type_id, (counts.get(r.room_type_id) ?? 0) + 1);
  }

  return ((types ?? []) as RoomType[]).map((t) => ({
    ...t,
    totalRooms: counts.get(t.id) ?? 0,
  }));
}

export interface AvailabilityResult {
  roomType: RoomType;
  totalRooms: number;
  availableRooms: number;
  quote: Quote;
}

/**
 * Computes availability per room type for a date range: total physical rooms of
 * that type minus reservations that overlap the range and are still live
 * (not cancelled / checked-out). A type is bookable when `availableRooms > 0`
 * and it can seat the requested party.
 */
export async function getAvailability(
  organizationId: string,
  params: {
    checkIn: string;
    checkOut: string;
    guests: number;
    roomTypeId?: string;
  },
): Promise<AvailabilityResult[]> {
  const supabase = createAdminClient();
  const nights = nightsBetween(params.checkIn, params.checkOut);

  const types = await getRoomTypes(organizationId);
  const filtered = params.roomTypeId
    ? types.filter((t) => t.id === params.roomTypeId)
    : types;

  // Reservations overlapping [checkIn, checkOut): check_in < checkOut AND
  // check_out > checkIn, excluding cancelled/checked-out.
  const { data: overlapping } = await supabase
    .from("reservations")
    .select("room_type_id, status, check_in, check_out")
    .eq("organization_id", organizationId)
    .in("status", ["PENDING", "CONFIRMED", "CHECKED_IN"])
    .lt("check_in", params.checkOut)
    .gt("check_out", params.checkIn);

  const booked = new Map<string, number>();
  for (const r of overlapping ?? []) {
    if (r.room_type_id)
      booked.set(r.room_type_id, (booked.get(r.room_type_id) ?? 0) + 1);
  }

  return filtered
    .filter((t) => t.capacity >= params.guests)
    .map((t) => {
      const available = Math.max(0, t.totalRooms - (booked.get(t.id) ?? 0));
      return {
        roomType: t,
        totalRooms: t.totalRooms,
        availableRooms: available,
        quote: quote(t.base_price, nights),
      };
    });
}
