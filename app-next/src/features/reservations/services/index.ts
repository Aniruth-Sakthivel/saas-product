import { createClient } from "@/lib/supabase/server";
import type { ReservationStatus } from "@/types/database";

export interface ReservationListItem {
  id: string;
  code: string;
  status: ReservationStatus;
  source: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total: number;
  room_id: string | null;
  created_at: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  roomTypeName: string | null;
  roomNumber: string | null;
}

/** All reservations for an org (newest first) with guest + room details. */
export async function listReservations(
  organizationId: string,
): Promise<ReservationListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservations")
    .select(
      `id, code, status, source, check_in, check_out, guests_count, total,
       room_id, created_at,
       guest:guests(full_name, email, phone),
       room_type:room_types(name),
       room:rooms(number)`,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    code: string;
    status: ReservationStatus;
    source: string;
    check_in: string;
    check_out: string;
    guests_count: number;
    total: number;
    room_id: string | null;
    created_at: string;
    guest: { full_name: string; email: string | null; phone: string | null } | null;
    room_type: { name: string } | null;
    room: { number: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    source: r.source,
    check_in: r.check_in,
    check_out: r.check_out,
    guests_count: r.guests_count,
    total: Number(r.total),
    room_id: r.room_id,
    created_at: r.created_at,
    guestName: r.guest?.full_name ?? "Guest",
    guestEmail: r.guest?.email ?? null,
    guestPhone: r.guest?.phone ?? null,
    roomTypeName: r.room_type?.name ?? null,
    roomNumber: r.room?.number ?? null,
  }));
}
