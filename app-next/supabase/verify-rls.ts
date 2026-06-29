/**
 * Verifies tenant isolation invariants on the live database:
 *   - every base table in `public` has RLS enabled, and
 *   - every table carrying `organization_id` also FORCEs RLS.
 * Exits non-zero on any violation. Run: npm run verify:rls
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
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}
loadEnv();

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL in .env.local");
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows } = await client.query<{
    relname: string;
    rls_enabled: boolean;
    rls_forced: boolean;
    has_org_id: boolean;
  }>(`
    select
      c.relname,
      c.relrowsecurity   as rls_enabled,
      c.relforcerowsecurity as rls_forced,
      exists (
        select 1 from information_schema.columns col
        where col.table_schema = 'public'
          and col.table_name = c.relname
          and col.column_name = 'organization_id'
      ) as has_org_id
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname;
  `);

  await client.end();

  const violations: string[] = [];
  for (const t of rows) {
    if (!t.rls_enabled) violations.push(`${t.relname}: RLS not enabled`);
    if (t.has_org_id && !t.rls_forced)
      violations.push(`${t.relname}: has organization_id but RLS not FORCEd`);
  }

  if (violations.length > 0) {
    console.error("❌ RLS verification failed:");
    for (const v of violations) console.error(`   - ${v}`);
    process.exit(1);
  }

  console.log(`✅ RLS verified on ${rows.length} tables — tenant isolation intact.`);
}

main().catch((err) => {
  console.error("verify-rls failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
