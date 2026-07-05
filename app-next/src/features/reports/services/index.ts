import { createClient } from "@/lib/supabase/server";

export interface ReportsData {
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  adr: number; // average daily rate
  revpar: number; // revenue per available room
  revenueTrend: { date: string; value: number }[];
  bySource: { source: string; count: number; revenue: number }[];
  byStatus: { status: string; count: number }[];
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function nights(a: string, b: string) {
  return Math.max(
    1,
    Math.round(
      (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
    ),
  );
}

export async function getReportsData(
  organizationId: string,
): Promise<ReportsData> {
  const supabase = await createClient();
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 29);

  const [roomsRes, reservationsRes, paymentsRes] = await Promise.all([
    supabase.from("rooms").select("status").eq("organization_id", organizationId),
    supabase
      .from("reservations")
      .select("status, source, total, check_in, check_out")
      .eq("organization_id", organizationId),
    supabase
      .from("payments")
      .select("amount, paid_at, status")
      .eq("organization_id", organizationId)
      .gte("paid_at", `${isoDate(start)}T00:00:00`),
  ]);

  const rooms = roomsRes.data ?? [];
  const totalRooms = rooms.length;
  const occupied = rooms.filter(
    (r) => r.status === "OCCUPIED" || r.status === "RESERVED",
  ).length;
  const occupancyRate = totalRooms
    ? Math.round((occupied / totalRooms) * 100)
    : 0;

  const reservations = reservationsRes.data ?? [];
  const active = reservations.filter((r) => r.status !== "CANCELLED");
  const roomRevenue = active.reduce((s, r) => s + Number(r.total), 0);
  const roomNights = active.reduce(
    (s, r) => s + nights(r.check_in, r.check_out),
    0,
  );
  const adr = roomNights ? Math.round(roomRevenue / roomNights) : 0;
  // RevPAR over the trailing 30-day window of available room-nights.
  const availableRoomNights = totalRooms * 30;
  const revpar = availableRoomNights
    ? Math.round(roomRevenue / availableRoomNights)
    : 0;

  const payments = paymentsRes.data ?? [];
  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + Number(p.amount), 0);

  const revenueByDay = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== "PAID") continue;
    const day = p.paid_at?.slice(0, 10);
    if (!day) continue;
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(p.amount));
  }
  const revenueTrend: { date: string; value: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = isoDate(d);
    revenueTrend.push({ date: ds, value: revenueByDay.get(ds) ?? 0 });
  }

  const sourceMap = new Map<string, { count: number; revenue: number }>();
  for (const r of active) {
    const s = sourceMap.get(r.source) ?? { count: 0, revenue: 0 };
    s.count += 1;
    s.revenue += Number(r.total);
    sourceMap.set(r.source, s);
  }
  const bySource = [...sourceMap.entries()]
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const statusMap = new Map<string, number>();
  for (const r of reservations)
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
  const byStatus = [...statusMap.entries()].map(([status, count]) => ({
    status,
    count,
  }));

  return {
    totalRevenue,
    totalBookings: reservations.length,
    occupancyRate,
    adr,
    revpar,
    revenueTrend,
    bySource,
    byStatus,
  };
}
