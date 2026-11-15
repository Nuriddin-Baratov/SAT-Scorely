import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getPracticeTest, practiceTests } from "@/entities/practice-test";
import { TestSessionPage, TestSessionSkeleton } from "@/pages/test-session";
import { defaultLocale, hasLocale } from "@/shared/i18n";

type Params = Promise<{ lang: string; testId: string }>;

export function generateStaticParams() {
  return practiceTests.filter((test) => !test.simulation).map((test) => ({ testId: test.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, testId } = await params;
  const test = getPracticeTest(testId);
  if (!test) return {};
  return { title: test.title[hasLocale(lang) ? lang : defaultLocale], robots: { index: false } };
}

async function Session({ params }: { params: Params }) {
  const { testId } = await params;
  if (!getPracticeTest(testId) || getPracticeTest(testId)?.simulation) notFound();
  return <TestSessionPage testId={testId} />;
}

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<TestSessionSkeleton />}>
      <Session params={params} />
    </Suspense>
  );
}
