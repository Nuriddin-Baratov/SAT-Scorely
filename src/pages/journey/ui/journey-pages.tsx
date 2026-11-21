import { LevelQuiz, PlanView } from "@/features/sat-journey";
import { PremiumShell } from "@/shared/ui/premium";

// Dashboard'dan "qayta topshirish" uchun; birinchi kirishdagi oqim modal ichida (JourneyGate).
export const QuizPage = () => <PremiumShell><LevelQuiz /></PremiumShell>;
export const PlanPage = () => <PremiumShell><PlanView /></PremiumShell>;
