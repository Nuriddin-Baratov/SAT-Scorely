import { Container } from "@/shared/ui/primitives";

export function TestSessionSkeleton() {
  return (
    <main className="flex-1" aria-busy>
      <Container className="grid gap-6 py-8 sm:py-12 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-4">
          <div className="h-[72px] animate-pulse rounded-3xl bg-surface-2" />
          <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-surface-2" />
      </Container>
    </main>
  );
}
