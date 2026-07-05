import { createClient } from "@/lib/supabase/server";

export interface GuestListItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  vip: boolean;
  created_at: string;
  bookings: number;
  totalSpend: number;
  lastCheckIn: string | null;
}

/** All guests for an org with derived booking counts and spend. */
export async function listGuests(
  organizationId: string,
): Promise<GuestListItem[]> {
  const supabase = await createClient();

  const [{ data: guests }, { data: reservations }] = await Promise.all([
    supabase
      .from("guests")
      .select("id, full_name, email, phone, city, vip, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reservations")
      .select("guest_id, total, check_in, status")
      .eq("organization_id", organizationId),
  ]);

  const stats = new Map<
    string,
    { bookings: number; totalSpend: number; lastCheckIn: string | null }
  >();
  for (const r of reservations ?? []) {
    if (!r.guest_id) continue;
    const s = stats.get(r.guest_id) ?? {
      bookings: 0,
      totalSpend: 0,
      lastCheckIn: null,
    };
    s.bookings += 1;
    if (r.status !== "CANCELLED") s.totalSpend += Number(r.total);
    if (!s.lastCheckIn || r.check_in > s.lastCheckIn) s.lastCheckIn = r.check_in;
    stats.set(r.guest_id, s);
  }

  return (guests ?? []).map((g) => {
    const s = stats.get(g.id);
    return {
      id: g.id,
      full_name: g.full_name,
      email: g.email,
      phone: g.phone,
      city: g.city,
      vip: g.vip,
      created_at: g.created_at,
      bookings: s?.bookings ?? 0,
      totalSpend: s?.totalSpend ?? 0,
      lastCheckIn: s?.lastCheckIn ?? null,
    };
  });
}
