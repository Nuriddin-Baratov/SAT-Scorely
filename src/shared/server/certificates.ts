import "server-only";

import { shortCode } from "./crypto";
import { query, queryOne } from "./db";

export interface CertificateRow {
  code: string;
  eventId: string;
  name: string;
  correct: number;
  total: number;
  scores: { rw?: number; math?: number };
  issuedAt: string;
}

type Raw = { code: string; event_id: string; name: string; correct: number; total: number; scores: CertificateRow["scores"]; issued_at: string | Date };

const toRow = (r: Raw): CertificateRow => ({
  code: r.code,
  eventId: r.event_id,
  name: r.name,
  correct: Number(r.correct),
  total: Number(r.total),
  scores: r.scores,
  issuedAt: new Date(r.issued_at).toISOString(),
});

const COLUMNS = "code, event_id, name, correct, total, scores, issued_at";

/** Sertifikati hali berilmagan, server tekshirgan yakuniy testlar */
export async function uncertifiedTests(userId: string, testId: string) {
  return query<{ event_id: string; correct: number; total: number; detail: Record<string, [number, number]> | null; created_at: string }>(
    `select e.event_id, e.correct, e.total, e.detail, e.created_at from xp_events e
     where e.user_id = $1 and e.kind = 'test' and e.ref = $2 and e.total > 0
       and not exists (select 1 from certificates c where c.user_id = e.user_id and c.event_id = e.event_id)`,
    [userId, testId],
  );
}

/** Sertifikat beradi (bitta test uchun bitta). Ism — hisobdagi ism, raqam — tasodifiy. */
export async function insertCertificate(
  userId: string,
  test: { eventId: string; correct: number; total: number; scores: CertificateRow["scores"]; issuedAt: string | Date },
) {
  const year = new Date(test.issuedAt).getUTCFullYear();
  await query(
    `insert into certificates (code, user_id, event_id, name, correct, total, scores, issued_at)
     select $1::text, u.id, $3::text, u.name, $4::int, $5::int, $6::text::jsonb, $7::text::timestamptz from users u where u.id = $2::text
     on conflict do nothing`,
    [
      `SP-${year}-${shortCode(5)}-${shortCode(5)}`,
      userId,
      test.eventId,
      test.correct,
      test.total,
      JSON.stringify(test.scores),
      new Date(test.issuedAt).toISOString(),
    ],
  );
}

export async function listCertificates(userId: string) {
  return (await query<Raw>(`select ${COLUMNS} from certificates where user_id = $1 order by issued_at desc`, [userId])).map(toRow);
}

export async function findCertificate(code: string) {
  const row = await queryOne<Raw>(`select ${COLUMNS} from certificates where code = $1`, [code]);
  return row ? toRow(row) : null;
}
