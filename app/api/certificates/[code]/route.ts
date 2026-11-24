import { findCertificate, handleError, json, rateLimit } from "@/shared/server";

const CODE_RE = /^SP-\d{4}-[A-Z2-9]{5}-[A-Z2-9]{5}$/;

/** Ochiq tekshiruv: raqam bo'yicha sertifikat haqiqiymi. Faqat sertifikatda yozilgan ma'lumot qaytadi. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    if (!rateLimit(request, "verify", 30)) return json({ error: "rate" }, 429);
    const code = (await params).code.trim().toUpperCase();
    const cert = CODE_RE.test(code) ? await findCertificate(code) : null;
    if (!cert) return json({ error: "not-found" }, 404);
    const { name, correct, total, scores, issuedAt } = cert;
    return json({ certificate: { code: cert.code, name, correct, total, scores, issuedAt } });
  } catch (error) {
    return handleError(error);
  }
}
