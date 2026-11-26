import type { Metadata } from "next";
import { Suspense } from "react";

import { SessionPage } from "@/pages/dashboard";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = { title: "Mashg'ulot · Session", robots: { index: false } };

async function Session({ searchParams }: { searchParams: SearchParams }) {
  const { id } = await searchParams;
  return <SessionPage id={typeof id === "string" ? id.slice(0, 40) : ""} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Session searchParams={searchParams} />
    </Suspense>
  );
}
