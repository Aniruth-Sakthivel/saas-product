/**
 * DESTRUCTIVE: drops the pre-existing (other app) objects and any prior
 * HotelOS objects in the public schema, then is followed by `npm run migrate`.
 * Run: npm run db:reset
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

function loadEnv() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const l of readFileSync(p, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL in .env.local");
  process.exit(1);
}

// Other app's tables + HotelOS tables (drop both for a clean slate).
const TABLES = [
  // other app
  "bookings", "reviews", "notifications", "payments", "rooms", "hotels", "users",
  // hotelos
  "audit_logs", "housekeeping_tasks", "stays", "invoices", "reservations",
  "guests", "room_types", "memberships", "organizations", "profiles",
];
const ENUMS = [
  '"BookingStatus"', '"PaymentStatus"', '"Role"',
  "user_role", "membership_status", "room_status", "reservation_status",
  "task_status", "task_priority", "payment_status", "payment_method",
  "invoice_status",
];
const FUNCS = [
  "handle_new_user()", "set_updated_at()",
  "is_org_member(uuid)", "has_org_role(uuid, user_role[])",
];

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Connected. Dropping existing objects…");

  await client.query("drop trigger if exists on_auth_user_created on auth.users;");
  for (const t of TABLES) {
    await client.query(`drop table if exists public.${t} cascade;`);
  }
  for (const f of FUNCS) {
    await client.query(`drop function if exists public.${f} cascade;`);
  }
  for (const e of ENUMS) {
    await client.query(`drop type if exists public.${e} cascade;`);
  }

  await client.end();
  console.log("✅ Reset complete. Now run: npm run migrate");
}

main().catch((err) => {
  console.error("Reset failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
