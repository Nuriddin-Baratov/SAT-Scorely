import { useStudentProfile } from "@/entities/student";
import { createStorageStore } from "@/shared/lib/react";
import type { Answers } from "./quiz";

export interface Account {
  name: string;
  email: string;
  /** Serverda ham akkaunt ochilganmi (baza ulangan bo'lsa) */
  cloud: boolean;
  createdAt: string;
}

// `scorely.` prefiksi — zaxira, sinxronizatsiya va "profilni o'chirish" ham shu yozuvlarni qamrab oladi.
export const accountStore = createStorageStore<Account | null>("scorely.account.v1", null);
export const answersStore = createStorageStore<Answers | null>("scorely.journey.v1", null);
/**
 * "Boshlash" bosilgan rejaning javoblari — dashboard aynan shu rejani ko'rsatadi.
 * (`answersStore` qayta topshirish paytida o'zgaradi, faol reja esa "Boshlash"gacha o'zgarmaydi.)
 */
export const activePlanStore = createStorageStore<Answers | null>("scorely.active-plan.v1", null);

export const sameAnswers = (a: Answers | null | undefined, b: Answers | null | undefined) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export type Stage = "register" | "onboarding" | "app";

/**
 * Kirish tartibi: Loading → Register → O'quvchi haqida savollar (testsiz) → Asosiy sayt.
 * `undefined` — hali yuklanmoqda. Profil bor bo'lsa — savollar allaqachon to'ldirilgan.
 */
export function useJourneyStage(): Stage | undefined {
  const account = accountStore.useValue();
  const profile = useStudentProfile();
  if (account === undefined || profile === undefined) return undefined;
  if (!account) return "register";
  return profile ? "app" : "onboarding";
}

export const flowRoutes = { quiz: "/quiz", plan: "/plan" } as const;
const PUBLIC = ["/login"];

/**
 * Qayerga yo'naltirish kerak (yoki `null`).
 * Ro'yxatdan o'tmagan foydalanuvchida yo'naltirish yo'q — Register ekrani istalgan sahifa ustidan ochiladi.
 */
export function guardRedirect(stage: Stage, path: string, hasAnswers: boolean): string | null {
  if (PUBLIC.includes(path) || stage !== "app") return null;
  if (path === "/") return "/dashboard";
  return path === "/plan" && !hasAnswers ? "/quiz" : null;
}
