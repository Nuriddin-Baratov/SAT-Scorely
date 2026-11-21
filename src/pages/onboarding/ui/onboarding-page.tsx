import { StudentOnboarding } from "@/features/sat-journey";
import { LocaleSwitcher } from "@/features/switch-locale";
import { ThemeToggle } from "@/features/toggle-theme";

/** O'quvchi haqidagi savollar (testsiz) — dashboard'dan rejani qayta tuzish uchun ham shu sahifa. */
export function OnboardingPage() {
  return (
    <StudentOnboarding
      toolbar={
        <>
          <LocaleSwitcher />
          <ThemeToggle className="hidden sm:flex" />
        </>
      }
    />
  );
}
