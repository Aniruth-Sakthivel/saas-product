/**
 * HotelOS seed — creates one demo organization with data mirroring the
 * static prototype (rooms 101–150, ~50 guests, ~30 reservations, invoices,
 * payments, housekeeping tasks).
 *
 * Run:  npm run seed
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

// --- tiny .env.local loader (no dependency) ---
function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OWNER_EMAIL = "owner@grandmarina.test";
const OWNER_PASSWORD = "Passw0rd!";

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const rint = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const FIRST = ["James","Olivia","Liam","Emma","Noah","Ava","Lucas","Sophia","Mason","Isabella","Ethan","Mia","Logan","Aria","Henry","Zoe","Leo","Nora","Adrian","Lily"];
const LAST = ["Carter","Bennett","Hughes","Ward","Foster","Reed","Cole","Bryant","Hayes","Murphy","Ross","Powell","Brooks","Torres","Gray","Price","Wood","Barnes","Kelly","Walsh"];
const CITIES = ["New York, USA","London, UK","Berlin, DE","Tokyo, JP","Sydney, AU","Toronto, CA","Dubai, AE","Mumbai, IN","Paris, FR","Rome, IT"];
const PREFS = ["High floor","Non-smoking","Late checkout","Ocean view","Quiet room","Early check-in","Extra pillows","Airport pickup"];
const ROOM_TYPES = [
  { name: "Standard Queen", base_price: 129, capacity: 2, beds: "1 Queen" },
  { name: "Deluxe King", base_price: 189, capacity: 2, beds: "1 King" },
  { name: "Twin Room", base_price: 149, capacity: 2, beds: "2 Twin" },
  { name: "Executive Suite", base_price: 329, capacity: 3, beds: "1 King + Sofa" },
  { name: "Family Suite", base_price: 279, capacity: 4, beds: "2 Queen" },
  { name: "Presidential Suite", base_price: 599, capacity: 4, beds: "1 King + Living" },
];
const ROOM_STATUSES = ["AVAILABLE","OCCUPIED","RESERVED","CLEANING","MAINTENANCE"] as const;

async function main() {
  console.log("→ Creating demo owner user…");
  let ownerId: string;
  const created = await supabase.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Aniruth R." },
  });
  if (created.data.user) {
    ownerId = created.data.user.id;
  } else {
    // Already exists — find it.
    const list = await supabase.auth.admin.listUsers();
    const existing = list.data.users.find((u) => u.email === OWNER_EMAIL);
    if (!existing) throw created.error ?? new Error("Could not create owner");
    ownerId = existing.id;
  }

  await supabase.from("profiles").upsert({
    id: ownerId,
    email: OWNER_EMAIL,
    full_name: "Aniruth R.",
  });

  console.log("→ Creating organization…");
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({
      name: "Grand Marina Hotel",
      slug: `grand-marina-${Date.now().toString(36)}`,
      type: "Resort",
      address: "120 Harbor View Blvd, Miami, FL",
      currency: "USD",
      timezone: "America/New_York",
      brand_color: "#4F46E5",
      created_by: ownerId,
    })
    .select()
    .single();
  if (orgErr || !org) throw orgErr;
  const orgId = org.id;

  await supabase.from("memberships").insert({
    organization_id: orgId,
    profile_id: ownerId,
    role: "OWNER",
    status: "ACTIVE",
  });

  console.log("→ Room types & rooms 101–150…");
  const { data: types } = await supabase
    .from("room_types")
    .insert(ROOM_TYPES.map((t) => ({ ...t, organization_id: orgId })))
    .select();
  if (!types) throw new Error("room types failed");

  const rooms = [];
  for (let n = 101; n <= 150; n++) {
    const type = types[(n - 101) % types.length];
    rooms.push({
      organization_id: orgId,
      number: String(n),
      room_type_id: type.id,
      floor: Math.min(5, Math.floor((n - 101) / 10) + 1),
      status: pick([...ROOM_STATUSES]),
    });
  }
  const { data: insertedRooms } = await supabase
    .from("rooms")
    .insert(rooms)
    .select();
  if (!insertedRooms) throw new Error("rooms failed");

  console.log("→ Guests…");
  const guests = Array.from({ length: 50 }).map(() => {
    const full_name = `${pick(FIRST)} ${pick(LAST)}`;
    const visits = rint(1, 15);
    return {
      organization_id: orgId,
      full_name,
      email: `${full_name.toLowerCase().replace(/\s/g, ".")}@example.com`,
      phone: `+1 (${rint(200, 989)}) ${rint(200, 989)}-${rint(1000, 9999)}`,
      city: pick(CITIES),
      vip: Math.random() > 0.8,
      preferences: [pick(PREFS), pick(PREFS)],
      notes: visits > 8 ? "Loyalty gold member." : "",
    };
  });
  const { data: insertedGuests } = await supabase
    .from("guests")
    .insert(guests)
    .select();
  if (!insertedGuests) throw new Error("guests failed");

  console.log("→ Reservations…");
  const today = new Date();
  const reservations = Array.from({ length: 30 }).map((_, i) => {
    const guest = pick(insertedGuests);
    const room = pick(insertedRooms);
    const ci = addDays(today, rint(-3, 20));
    const nights = rint(1, 8);
    const co = addDays(ci, nights);
    const type = types.find((t) => t.id === room.room_type_id) ?? types[0];
    return {
      organization_id: orgId,
      code: `RSV-${2050 + i}`,
      guest_id: guest.id,
      room_id: room.id,
      room_type_id: room.room_type_id,
      check_in: isoDate(ci),
      check_out: isoDate(co),
      guests_count: rint(1, 4),
      status: pick(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]),
      source: pick(["Direct", "Booking.com", "Expedia", "Airbnb", "Corporate"]),
      total: Number(type.base_price) * nights,
    };
  });
  const { data: insertedRes } = await supabase
    .from("reservations")
    .insert(reservations)
    .select();
  if (!insertedRes) throw new Error("reservations failed");

  console.log("→ Invoices & payments…");
  const methods = ["CARD", "CASH", "BANK_TRANSFER", "UPI", "PAYPAL"] as const;
  for (let i = 0; i < 20; i++) {
    const res = pick(insertedRes);
    const subtotal = Number(res.total) || rint(180, 1200);
    const gstRate = 18;
    const gstAmount = Math.round((subtotal * gstRate) / 100);
    const status = pick(["PAID", "PENDING", "OVERDUE", "PAID"] as const);
    const { data: inv } = await supabase
      .from("invoices")
      .insert({
        organization_id: orgId,
        number: `INV-${90120 + i}`,
        reservation_id: res.id,
        guest_id: res.guest_id,
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total: subtotal + gstAmount,
        status,
        issued_at: isoDate(addDays(today, -rint(0, 30))),
      })
      .select()
      .single();
    if (inv && status === "PAID") {
      await supabase.from("payments").insert({
        organization_id: orgId,
        invoice_id: inv.id,
        amount: inv.total,
        method: pick([...methods]),
        status: "PAID",
        paid_at: addDays(today, -rint(0, 13)).toISOString(),
      });
    }
  }

  console.log("→ Housekeeping tasks…");
  const tasks = Array.from({ length: 16 }).map(() => ({
    organization_id: orgId,
    room_id: pick(insertedRooms).id,
    title: pick(["Full clean", "Linen change", "Turndown", "Deep clean", "Restock minibar"]),
    priority: pick(["LOW", "MEDIUM", "HIGH"] as const),
    status: pick(["PENDING", "IN_PROGRESS", "INSPECTION", "COMPLETED"] as const),
    due_at: addDays(today, rint(0, 2)).toISOString(),
  }));
  await supabase.from("housekeeping_tasks").insert(tasks);

  await supabase.from("audit_logs").insert({
    organization_id: orgId,
    actor_profile_id: ownerId,
    action: "seed.completed",
    entity: "organization",
    entity_id: orgId,
    metadata: { rooms: insertedRooms.length, guests: insertedGuests.length },
  });

  console.log("\n✅ Seed complete.");
  console.log(`   Organization: ${org.name} (${orgId})`);
  console.log(`   Owner login:  ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
