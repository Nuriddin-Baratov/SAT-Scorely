import "server-only";

import { FINAL_TEST_ID } from "@/entities/practice-test";
import { getDomain, scaleSection, type DomainId, type SectionId } from "@/entities/sat";
import { insertCertificate, listCertificates, uncertifiedTests } from "@/shared/server";

/** Bo'lim ballari server tekshirgan domen natijalaridan (200–800) */
function sectionScores(detail: Record<string, [number, number]> | null) {
  const sums: Partial<Record<SectionId, [number, number]>> = {};
  for (const [id, [correct, total]] of Object.entries(detail ?? {})) {
    const s = (sums[getDomain(id as DomainId).sectionId] ??= [0, 0]);
    s[0] += correct;
    s[1] += total;
  }
  return Object.fromEntries(Object.entries(sums).map(([id, [c, n]]) => [id, scaleSection(c / n)])) as { rw?: number; math?: number };
}

/** Yakuniy testlar uchun berilmagan sertifikatlarni beradi va foydalanuvchining hammasini qaytaradi */
export async function ensureCertificates(userId: string) {
  for (const t of await uncertifiedTests(userId, FINAL_TEST_ID)) {
    await insertCertificate(userId, {
      eventId: t.event_id,
      correct: Number(t.correct),
      total: Number(t.total),
      scores: sectionScores(t.detail),
      issuedAt: t.created_at,
    });
  }
  return listCertificates(userId);
}
