import { createClient } from "@/lib/supabase/server";
import type { RoomStatus } from "@/types/database";

export interface RoomListItem {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  roomTypeName: string | null;
  basePrice: number;
}

export interface RoomTypeSummary {
  id: string;
  name: string;
  basePrice: number;
  capacity: number;
  beds: string | null;
  totalRooms: number;
}

export interface RoomsData {
  rooms: RoomListItem[];
  roomTypes: RoomTypeSummary[];
  statusCounts: Record<RoomStatus, number>;
}

const ROOM_STATUSES: RoomStatus[] = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "MAINTENANCE",
];

export async function getRoomsData(organizationId: string): Promise<RoomsData> {
  const supabase = await createClient();
  const [{ data: types }, { data: rooms }] = await Promise.all([
    supabase
      .from("room_types")
      .select("id, name, base_price, capacity, beds")
      .eq("organization_id", organizationId)
      .order("base_price"),
    supabase
      .from("rooms")
      .select("id, number, floor, status, room_type_id")
      .eq("organization_id", organizationId)
      .order("number"),
  ]);

  const typeById = new Map(
    (types ?? []).map((t) => [t.id, t] as const),
  );
  const counts = new Map<string, number>();

  const roomList: RoomListItem[] = (rooms ?? []).map((r) => {
    if (r.room_type_id)
      counts.set(r.room_type_id, (counts.get(r.room_type_id) ?? 0) + 1);
    const t = r.room_type_id ? typeById.get(r.room_type_id) : null;
    return {
      id: r.id,
      number: r.number,
      floor: r.floor,
      status: r.status as RoomStatus,
      roomTypeName: t?.name ?? null,
      basePrice: t ? Number(t.base_price) : 0,
    };
  });

  const statusCounts = ROOM_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<RoomStatus, number>,
  );
  for (const r of roomList) statusCounts[r.status]++;

  const roomTypes: RoomTypeSummary[] = (types ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    basePrice: Number(t.base_price),
    capacity: t.capacity,
    beds: t.beds,
    totalRooms: counts.get(t.id) ?? 0,
  }));

  return { rooms: roomList, roomTypes, statusCounts };
}
