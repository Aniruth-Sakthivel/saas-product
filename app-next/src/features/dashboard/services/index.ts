import { createClient } from "@/lib/supabase/server";
import type { AuditLog, RoomStatus } from "@/types/database";

export interface DashboardData {
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  revenueToday: number;
  arrivalsToday: number;
  departuresToday: number;
  roomStatusCounts: Record<RoomStatus, number>;
  revenueTrend: { date: string; value: number }[];
  occupancyTrend: { date: string; value: number }[];
  activity: AuditLog[];
}

const ROOM_STATUSES: RoomStatus[] = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "MAINTENANCE",
];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getDashboardData(
  organizationId: string,
): Promise<DashboardData> {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = isoDate(today);
  const start = new Date(today);
  start.setDate(start.getDate() - 13);

  const [roomsRes, reservationsRes, paymentsRes, activityRes] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("status")
        .eq("organization_id", organizationId),
      supabase
        .from("reservations")
        .select("check_in, check_out, status, total")
        .eq("organization_id", organizationId)
        .gte("check_out", isoDate(start)),
      supabase
        .from("payments")
        .select("amount, paid_at, status")
        .eq("organization_id", organizationId)
        .gte("paid_at", `${isoDate(start)}T00:00:00`),
      supabase
        .from("audit_logs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const rooms = roomsRes.data ?? [];
  const totalRooms = rooms.length;

  const roomStatusCounts = ROOM_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<RoomStatus, number>,
  );
  for (const r of rooms) roomStatusCounts[r.status as RoomStatus]++;
  const occupiedRooms = roomStatusCounts.OCCUPIED + roomStatusCounts.RESERVED;
  const occupancyRate = totalRooms
    ? Math.round((occupiedRooms / totalRooms) * 100)
    : 0;

  const reservations = reservationsRes.data ?? [];
  const arrivalsToday = reservations.filter(
    (r) =>
      r.check_in === todayStr &&
      (r.status === "CONFIRMED" || r.status === "PENDING"),
  ).length;
  const departuresToday = reservations.filter(
    (r) => r.check_out === todayStr && r.status === "CHECKED_IN",
  ).length;

  const payments = paymentsRes.data ?? [];
  const revenueToday = payments
    .filter((p) => p.paid_at?.slice(0, 10) === todayStr && p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Build 14-day trends
  const revenueByDay = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== "PAID") continue;
    const day = p.paid_at?.slice(0, 10);
    if (!day) continue;
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(p.amount));
  }

  const revenueTrend: { date: string; value: number }[] = [];
  const occupancyTrend: { date: string; value: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = isoDate(d);
    revenueTrend.push({ date: ds, value: revenueByDay.get(ds) ?? 0 });

    const active = reservations.filter(
      (r) =>
        r.check_in <= ds &&
        r.check_out > ds &&
        r.status !== "CANCELLED",
    ).length;
    occupancyTrend.push({
      date: ds,
      value: totalRooms ? Math.round((active / totalRooms) * 100) : 0,
    });
  }

  return {
    occupancyRate,
    totalRooms,
    occupiedRooms,
    revenueToday,
    arrivalsToday,
    departuresToday,
    roomStatusCounts,
    revenueTrend,
    occupancyTrend,
    activity: (activityRes.data ?? []) as AuditLog[],
  };
}
