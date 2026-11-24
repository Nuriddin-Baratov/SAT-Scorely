import { connection } from "next/server";

import { ensureCertificates } from "@/features/xp-ledger";
import { handleError, json, requireUser } from "@/shared/server";

/** Mening sertifikatlarim (berilmaganlari shu yerda beriladi) */
export async function GET() {
  await connection();
  try {
    const user = await requireUser();
    return json({ certificates: await ensureCertificates(user.id) });
  } catch (error) {
    return handleError(error);
  }
}
