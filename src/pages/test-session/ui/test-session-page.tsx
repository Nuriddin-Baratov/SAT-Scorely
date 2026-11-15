import { notFound } from "next/navigation";

import { getPracticeTest } from "@/entities/practice-test";
import { TestRunner } from "@/features/take-test";
import { Container } from "@/shared/ui/primitives";

export function TestSessionPage({ testId }: { testId: string }) {
  const test = getPracticeTest(testId);
  if (!test) notFound();

  return (
    <main className="flex-1">
      <Container className="py-8 sm:py-12">
        <TestRunner test={test} />
      </Container>
    </main>
  );
}
