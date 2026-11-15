import "server-only";

import { cookies } from "next/headers";

import { hashPassword, newId, randomToken, sha256, verifyPassword } from "./crypto";
import { query, queryOne } from "./db";

export const SESSION_COOKIE = "scorely_session";
const SESSION_DAYS = 30;

export type Role = "student" | "teacher";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  publicProfile: boolean;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  public_profile: boolean;
  password_hash: string;
}

const toPublic = (row: UserRow): PublicUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  publicProfile: row.public_profile,
});

export class AuthError extends Error {
  constructor(public code: "invalid" | "exists" | "weak" | "unauthorized" | "forbidden") {
    super(code);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function registerUser(input: { name: string; email: string; password: string; role: Role }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 60);
  if (name.length < 2 || !EMAIL_RE.test(email)) throw new AuthError("invalid");
  if (input.password.length < 8) throw new AuthError("weak");
  if (await queryOne("select 1 from users where email = $1", [email])) throw new AuthError("exists");

  const id = newId();
  await query("insert into users (id, email, name, password_hash, role) values ($1, $2, $3, $4, $5)", [
    id,
    email,
    name,
    await hashPassword(input.password),
    input.role === "teacher" ? "teacher" : "student",
  ]);
  return id;
}

export async function verifyCredentials(email: string, password: string) {
  const row = await queryOne<UserRow>("select * from users where email = $1", [email.trim().toLowerCase()]);
  // Foydalanuvchi yo'q bo'lsa ham xesh tekshiruvi vaqtini “taqlid” qilamiz (timing hujumlariga qarshi)
  const ok = await verifyPassword(password, row?.password_hash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAA");
  if (!row || !ok) throw new AuthError("invalid");
  return row.id;
}

/** Yangi sessiya yaratadi va httpOnly cookie o'rnatadi */
export async function startSession(userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [sha256(token), userId, expires]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query("delete from sessions where token_hash = $1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** Joriy foydalanuvchi (cookie bo'yicha) yoki `null` */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await queryOne<UserRow>(
    `select u.* from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [sha256(token)],
  );
  return row ? toPublic(row) : null;
}

export async function requireUser(role?: Role): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthorized");
  if (role && user.role !== role) throw new AuthError("forbidden");
  return user;
}

export async function updateProfile(userId: string, patch: { name?: string; publicProfile?: boolean }) {
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 60);
    if (name.length < 2) throw new AuthError("invalid");
    await query("update users set name = $2 where id = $1", [userId, name]);
  }
  if (patch.publicProfile !== undefined) {
    await query("update users set public_profile = $2 where id = $1", [userId, patch.publicProfile]);
  }
}

export async function deleteAccount(userId: string) {
  await query("delete from users where id = $1", [userId]);
  (await cookies()).delete(SESSION_COOKIE);
}
