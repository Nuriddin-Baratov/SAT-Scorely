import type { Metadata } from "next";
import { Suspense } from "react";

import { CertificatePage } from "@/pages/certificate";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = { title: "Sertifikat · Certificate", robots: { index: false } };

/**
 * `/certificate?id=…` — yo'l statik, shuning uchun layout'dagi `usePathname()` prerender'ni bloklamaydi.
 * `id` faqat so'rov paytida ma'lum, shu sababli o'qish `Suspense` ichida.
 */
async function Certificate({ searchParams }: { searchParams: SearchParams }) {
  const { id } = await searchParams;
  return <CertificatePage id={typeof id === "string" ? id : ""} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Certificate searchParams={searchParams} />
    </Suspense>
  );
}
