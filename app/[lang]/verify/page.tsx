import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyPage } from "@/pages/certificate";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = { title: "Sertifikatni tekshirish · Verify", robots: { index: false } };

async function Verify({ searchParams }: { searchParams: SearchParams }) {
  const { code } = await searchParams;
  return <VerifyPage code={typeof code === "string" ? code.slice(0, 40) : ""} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Verify searchParams={searchParams} />
    </Suspense>
  );
}
