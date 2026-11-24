// Supabase'da himoya (RLS) va real-time triggerlarini o'rnatadi.
// Ishga tushirish: node --env-file=<env fayl> scripts/supabase-setup.mjs
import { readFileSync } from "node:fs";

import postgres from "postgres";

import { SCHEMA } from "../src/shared/server/schema.ts";

const url = process.env.SB_POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("SB_POSTGRES_URL_NON_POOLING kerak (vercel env pull).");
  process.exit(1);
}

const clean = new URL(url);
for (const key of ["supa", "pgbouncer", "sslmode"]) clean.searchParams.delete(key);
const sql = postgres(clean.toString(), { ssl: "require", max: 1, onnotice: () => {} });
try {
  // Avval jadvallar (yangilari ham), keyin ularga darhol himoya
  for (const statement of SCHEMA) await sql.unsafe(statement);
  await sql.unsafe(readFileSync(new URL("../supabase/setup.sql", import.meta.url), "utf8")).simple();
  console.log("Supabase sozlandi: RLS, signallar, kanal siyosati.");
} finally {
  await sql.end();
}
