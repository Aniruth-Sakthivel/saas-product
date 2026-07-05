import { createClient } from "@/lib/supabase/server";

export interface ArrivalItem {
  id: string;
  code: string;
  guestName: string;
  guests_count: number;
  check_in: string;
  check_out: string;
  roomTypeId: string | null;
  roomTypeName: string | null;
  status: string;
}

export interface InHouseItem {
  id: string;
  code: string;
  guestName: string;
  roomNumber: string | null;
  check_out: string;
  departingToday: boolean;
}

export interface AvailableRoom {
  id: string;
  number: string;
  roomTypeId: string | null;
  roomTypeName: string | null;
}

export interface FrontDeskData {
  today: string;
  arrivals: ArrivalItem[];
  inHouse: InHouseItem[];
  departuresToday: number;
  availableRooms: AvailableRoom[];
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getFrontDeskData(
  organizationId: string,
): Promise<FrontDeskData> {
  const supabase = await createClient();
  const today = isoDate(new Date());

  const [{ data: reservations }, { data: rooms }, { data: types }] =
    await Promise.all([
      supabase
        .from("reservations")
        .select(
          `id, code, status, check_in, check_out, guests_count, room_type_id, room_id,
           guest:guests(full_name), room:rooms(number)`,
        )
        .eq("organization_id", organizationId)
        .in("status", ["PENDING", "CONFIRMED", "CHECKED_IN"])
        .order("check_in"),
      supabase
        .from("rooms")
        .select("id, number, room_type_id, status")
        .eq("organization_id", organizationId)
        .eq("status", "AVAILABLE")
        .order("number"),
      supabase
        .from("room_types")
        .select("id, name")
        .eq("organization_id", organizationId),
    ]);

  const typeName = new Map((types ?? []).map((t) => [t.id, t.name] as const));

  type Row = {
    id: string;
    code: string;
    status: string;
    check_in: string;
    check_out: string;
    guests_count: number;
    room_type_id: string | null;
    room_id: string | null;
    guest: { full_name: string } | null;
    room: { number: string } | null;
  };
  const rows = (reservations ?? []) as unknown as Row[];

  const arrivals: ArrivalItem[] = rows
    .filter(
      (r) =>
        (r.status === "PENDING" || r.status === "CONFIRMED") &&
        r.check_in <= today,
    )
    .map((r) => ({
      id: r.id,
      code: r.code,
      guestName: r.guest?.full_name ?? "Guest",
      guests_count: r.guests_count,
      check_in: r.check_in,
      check_out: r.check_out,
      roomTypeId: r.room_type_id,
      roomTypeName: r.room_type_id ? typeName.get(r.room_type_id) ?? null : null,
      status: r.status,
    }));

  const inHouse: InHouseItem[] = rows
    .filter((r) => r.status === "CHECKED_IN")
    .map((r) => ({
      id: r.id,
      code: r.code,
      guestName: r.guest?.full_name ?? "Guest",
      roomNumber: r.room?.number ?? null,
      check_out: r.check_out,
      departingToday: r.check_out === today,
    }));

  const availableRooms: AvailableRoom[] = (rooms ?? []).map((r) => ({
    id: r.id,
    number: r.number,
    roomTypeId: r.room_type_id,
    roomTypeName: r.room_type_id ? typeName.get(r.room_type_id) ?? null : null,
  }));

  return {
    today,
    arrivals,
    inHouse,
    departuresToday: inHouse.filter((r) => r.departingToday).length,
    availableRooms,
  };
}
