import "server-only";

import { AuthError } from "./auth";
import { newId, shortCode } from "./crypto";
import { query, queryOne } from "./db";

// ---------------- Bulutga sinxronlash ----------------

/** Brauzerdan keladigan qisqa statistika (reyting va o'qituvchi paneli uchun) */
export interface SyncStats {
  xp: number;
  streak: number;
  accuracy: number | null;
  questions: number;
  weakDomain: string | null;
  lastActive: string | null;
  /** Mijozning bugungi sanasi (`YYYY-MM-DD`) — XP tarixini kunlar bo'yicha yozish uchun */
  today: string;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const int = (n: unknown, max = 10_000_000) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));

export async function saveSnapshot(userId: string, snapshot: unknown, stats: SyncStats) {
  if (!snapshot || typeof snapshot !== "object") throw new AuthError("invalid");
  const today = DAY_RE.test(stats.today) ? stats.today : new Date().toISOString().slice(0, 10);
  const accuracy = typeof stats.accuracy === "number" && stats.accuracy >= 0 && stats.accuracy <= 1 ? stats.accuracy : null;
  const lastActive = stats.lastActive && DAY_RE.test(stats.lastActive) ? stats.lastActive : null;
  const xp = int(stats.xp);

  await query(
    `insert into user_data (user_id, snapshot, xp, streak, accuracy, questions, weak_domain, last_active, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (user_id) do update set snapshot = excluded.snapshot, xp = excluded.xp, streak = excluded.streak,
       accuracy = excluded.accuracy, questions = excluded.questions, weak_domain = excluded.weak_domain,
       last_active = excluded.last_active, updated_at = now()`,
    [userId, JSON.stringify(snapshot), xp, int(stats.streak, 10_000), accuracy, int(stats.questions), stats.weakDomain?.slice(0, 40) ?? null, lastActive],
  );
  await query(
    `insert into xp_daily (user_id, day, xp) values ($1, $2, $3)
     on conflict (user_id, day) do update set xp = greatest(xp_daily.xp, excluded.xp)`,
    [userId, today, xp],
  );
}

export async function loadSnapshot(userId: string) {
  return queryOne<{ snapshot: unknown; updated_at: string }>("select snapshot, updated_at from user_data where user_id = $1", [userId]);
}

// ---------------- Reyting ----------------

export interface LeaderRow {
  userId: string;
  name: string;
  xp: number;
  weeklyXp: number;
  streak: number;
}

/** Ism: “Aziza K.” — maxfiylik uchun familiyaning faqat bosh harfi */
function shortName(full: string) {
  const [first, last] = full.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

/**
 * Reyting: `week` — joriy hafta (dushanbadan) to'plangan XP, `all` — umumiy XP.
 * `classId` berilsa — faqat shu sinf a'zolari.
 */
export async function leaderboard(scope: "week" | "all", weekStart: string, classId?: string, limit = 50): Promise<LeaderRow[]> {
  const rows = await query<{ id: string; name: string; xp: number; streak: number; base: number | null }>(
    // left join: yangi ro'yxatdan o'tgan (hali progress sinxronlanmagan) o'quvchilar ham 0 XP bilan ko'rinadi
    `select u.id, u.name, coalesce(d.xp, 0) as xp, coalesce(d.streak, 0) as streak,
       (select x.xp from xp_daily x where x.user_id = u.id and x.day < $1 order by x.day desc limit 1) as base
     from users u left join user_data d on d.user_id = u.id
     where u.public_profile = true and u.role = 'student'
       ${classId ? "and exists (select 1 from class_members m where m.class_id = $2 and m.user_id = u.id)" : ""}`,
    classId ? [weekStart, classId] : [weekStart],
  );
  return rows
    .map((r) => ({
      userId: r.id,
      name: shortName(r.name),
      xp: Number(r.xp),
      weeklyXp: Math.max(0, Number(r.xp) - Number(r.base ?? 0)),
      streak: Number(r.streak),
    }))
    .sort((a, b) => (scope === "week" ? b.weeklyXp - a.weeklyXp : b.xp - a.xp))
    .slice(0, limit);
}

// ---------------- Sinflar (o'qituvchi paneli) ----------------

export async function createClass(teacherId: string, name: string) {
  const title = name.trim().slice(0, 60);
  if (title.length < 2) throw new AuthError("invalid");
  const id = newId();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = shortCode(6);
    try {
      await query("insert into classes (id, teacher_id, name, code) values ($1, $2, $3, $4)", [id, teacherId, title, code]);
      return { id, name: title, code };
    } catch {
      // kod band — boshqasini urinib ko'ramiz
    }
  }
  throw new Error("could not allocate class code");
}

export async function deleteClass(teacherId: string, classId: string) {
  await query("delete from classes where id = $1 and teacher_id = $2", [classId, teacherId]);
}

export async function joinClass(userId: string, code: string) {
  const cls = await queryOne<{ id: string; name: string }>("select id, name from classes where code = $1", [code.trim().toUpperCase()]);
  if (!cls) throw new AuthError("invalid");
  await query("insert into class_members (class_id, user_id) values ($1, $2) on conflict do nothing", [cls.id, userId]);
  return cls;
}

export async function leaveClass(userId: string, classId: string) {
  await query("delete from class_members where class_id = $1 and user_id = $2", [classId, userId]);
}

export async function removeMember(teacherId: string, classId: string, userId: string) {
  await query(
    "delete from class_members m using classes c where m.class_id = c.id and c.id = $1 and c.teacher_id = $2 and m.user_id = $3",
    [classId, teacherId, userId],
  );
}

export interface ClassMember {
  userId: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  accuracy: number | null;
  questions: number;
  weakDomain: string | null;
  lastActive: string | null;
}

export async function teacherClasses(teacherId: string) {
  const classes = await query<{ id: string; name: string; code: string }>(
    "select id, name, code from classes where teacher_id = $1 order by created_at",
    [teacherId],
  );
  const members = await query<{
    class_id: string;
    user_id: string;
    name: string;
    email: string;
    xp: number | null;
    streak: number | null;
    accuracy: number | null;
    questions: number | null;
    weak_domain: string | null;
    last_active: string | null;
  }>(
    `select m.class_id, u.id as user_id, u.name, u.email, d.xp, d.streak, d.accuracy, d.questions, d.weak_domain, d.last_active
     from class_members m join classes c on c.id = m.class_id join users u on u.id = m.user_id
     left join user_data d on d.user_id = u.id
     where c.teacher_id = $1 order by u.name`,
    [teacherId],
  );
  return classes.map((c) => ({
    ...c,
    members: members
      .filter((m) => m.class_id === c.id)
      .map(
        (m): ClassMember => ({
          userId: m.user_id,
          name: m.name,
          email: m.email,
          xp: Number(m.xp ?? 0),
          streak: Number(m.streak ?? 0),
          accuracy: m.accuracy === null ? null : Number(m.accuracy),
          questions: Number(m.questions ?? 0),
          weakDomain: m.weak_domain,
          lastActive: m.last_active,
        }),
      ),
  }));
}

export async function studentClasses(userId: string) {
  return query<{ id: string; name: string; teacher: string }>(
    `select c.id, c.name, u.name as teacher from class_members m
     join classes c on c.id = m.class_id join users u on u.id = c.teacher_id
     where m.user_id = $1 order by m.joined_at`,
    [userId],
  );
}
