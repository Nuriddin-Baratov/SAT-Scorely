import "server-only";

import { SCHEMA } from "./schema";

/**
 * Ma'lumotlar bazasi: `DATABASE_URL` berilgan bo'lsa — haqiqiy Postgres (Vercel Postgres / Neon / o'zingizniki),
 * aks holda lokal ishlab chiqish uchun PGlite (Postgres WASM, `.data/pglite` papkasida saqlanadi).
 */
/** Vercel/Neon integratsiyasi ba'zan faqat POSTGRES_URL ni qo'shadi — ikkalasini ham qabul qilamiz */
function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

/**
 * Baza mavjudmi: haqiqiy Postgres URL bor, yoki lokal kompyuter (PGlite).
 * Vercel kabi serverless muhitda fayl tizimi faqat o'qish uchun — u yerda PGlite ishlamaydi.
 */
export function databaseConfigured() {
  return !!databaseUrl() || !process.env.VERCEL;
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
  }
}

interface Db {
  query<T>(text: string, params?: unknown[]): Promise<T[]>;
}

async function connect(): Promise<Db> {
  const url = databaseUrl();
  if (url) {
    const { default: postgres } = await import("postgres");
    const local = /localhost|127\.0\.0\.1/.test(url);
    const sql = postgres(url, { ssl: local ? false : "require", max: 5, idle_timeout: 20 });
    return {
      query: async <T>(text: string, params: unknown[] = []) =>
        (await sql.unsafe(text, params as never[])) as unknown as T[],
    };
  }
  if (!databaseConfigured()) throw new DatabaseUnavailableError();
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdir } = await import("node:fs/promises");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  await mkdir(dir, { recursive: true });
  const pg = new PGlite(dir);
  return {
    query: async <T>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows,
  };
}

async function init(): Promise<Db> {
  const db = await connect();
  // Jadvallar idempotent yaratiladi (CREATE … IF NOT EXISTS)
  for (const statement of SCHEMA) await db.query(statement);
  return db;
}

// Dev rejimida HMR paytida ulanish takrorlanmasligi uchun global keshda saqlaymiz.
const globalForDb = globalThis as unknown as { __scorelyDb?: Promise<Db> };

function getDb() {
  globalForDb.__scorelyDb ??= init().catch((error) => {
    globalForDb.__scorelyDb = undefined;
    throw error;
  });
  return globalForDb.__scorelyDb;
}

/** Parametrli so'rov ($1, $2 …). SQL injection'dan himoya — qiymatlar doim `params` orqali. */
export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await getDb()).query<T>(text, params);
}

export async function queryOne<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(text, params))[0] ?? null;
}
