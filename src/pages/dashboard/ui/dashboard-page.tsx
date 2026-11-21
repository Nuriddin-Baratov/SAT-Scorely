import { PlanPanel } from "@/features/sat-journey";
import { StudyDashboard } from "@/widgets/study-dashboard";
import { Container } from "@/shared/ui/primitives";

export function DashboardPage() {
  return (
    <main className="flex-1">
      <Container className="py-4 sm:py-14">
        <PlanPanel />
        <StudyDashboard />
      </Container>
    </main>
  );
}
