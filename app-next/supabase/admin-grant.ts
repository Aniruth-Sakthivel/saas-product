/**
 * Grants or lists platform (super) admins.
 *   npm run admin:grant <email>   — promote the profile with that email
 *   npm run admin:list            — list current platform admins
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) throw new Error("Missing SUPABASE_DB_URL in .env.local");

async function main() {
  const mode = process.argv[2]; // "grant" | "list"
  const email = process.argv[3];
  const db = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await db.connect();

  if (mode === "list") {
    const { rows } = await db.query(
      `select p.email, a.created_at from platform_admins a
       join profiles p on p.id = a.profile_id order by a.created_at`,
    );
    if (rows.length === 0) console.log("No platform admins yet.");
    for (const r of rows) console.log(`- ${r.email} (since ${r.created_at.toISOString().slice(0, 10)})`);
    await db.end();
    return;
  }

  if (mode === "grant") {
    if (!email) throw new Error("Usage: npm run admin:grant <email>");
    const { rows } = await db.query("select id from profiles where lower(email) = lower($1)", [email]);
    if (rows.length === 0) throw new Error(`No profile found for ${email}. They must sign up first.`);
    await db.query(
      "insert into platform_admins (profile_id) values ($1) on conflict (profile_id) do nothing",
      [rows[0].id],
    );
    console.log(`✅ ${email} is now a platform admin.`);
    await db.end();
    return;
  }

  throw new Error("Usage: admin-grant.ts <grant|list> [email]");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
