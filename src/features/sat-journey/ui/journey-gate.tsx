"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useStudentProfile } from "@/entities/student";
import { useSession } from "@/entities/user";
import { useI18n } from "@/shared/i18n";

import { accountStore, activePlanStore, answersStore, guardRedirect, useJourneyStage } from "../model/store";
import { RegisterForm } from "./register-form";
import { StudentOnboarding } from "./student-onboarding";

/**
 * Route guard: ro'yxatdan o'tmagan foydalanuvchi saytga kira olmaydi —
 * istalgan sahifa ustidan to'liq ekranli Register ochiladi.
 * `toolbar` — Register ekranidagi til/mavzu tugmalari (app qatlamidan).
 */
export function JourneyGate({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) {
  const stage = useJourneyStage();
  const session = useSession();
  const answers = answersStore.useValue();
  const profile = useStudentProfile();
  const pathname = usePathname();
  const router = useRouter();
  const { locale, href } = useI18n();

  const path = (pathname ?? "/").replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";
  const redirect = stage ? guardRedirect(stage, path, !!answers) : null;
  const showRegister = stage === "register" && path !== "/login";
  // /onboarding sahifasi so'rovnomani o'zi ko'rsatadi — ikki marta ochilmasin
  const showOnboarding = stage === "onboarding" && path !== "/login" && path !== "/onboarding";

  useEffect(() => {
    const account = accountStore.get();
    // Server akkaunti bilan kirgan foydalanuvchi — lokal akkaunt sifatida ham belgilanadi.
    if (session.status === "user" && account === null) {
      const { name, email } = session.user;
      accountStore.set({ name, email, cloud: true, createdAt: new Date().toISOString() });
    }
    // Server ishlayapti, lekin sessiya yo'q: akkauntdan chiqilgan, o'chirilgan yoki hisob avval faqat shu
    // qurilmada ochilgan (bazada yo'q) — qaytadan ro'yxatdan o'tish/kirish. Qurilmadagi progress o'chmaydi:
    // ro'yxatdan o'tgach, u yangi hisobga biriktiriladi.
    if (session.status === "guest" && account) accountStore.clear();
  }, [session]);

  // Dashboard'da "profilni o'chirish" bosildi — eski reja ham bekor bo'ladi.
  useEffect(() => {
    if (profile === null && activePlanStore.get()) {
      activePlanStore.clear();
      answersStore.clear();
    }
  }, [profile]);

  useEffect(() => {
    if (redirect) router.replace(href(redirect));
  }, [redirect, router, href]);

  // Kontent doim chiziladi (SSR/instant navigation uchun); ruxsat bo'lmaguncha unga bosib bo'lmaydi.
  const blocked = !stage || !!redirect || showRegister || showOnboarding;
  return (
    <>
      <div inert={blocked} className="contents">
        {children}
      </div>
      {(!stage || redirect) && <div className="fixed inset-0 z-[56] bg-bg" aria-busy />}
      {showRegister && <RegisterForm toolbar={toolbar} />}
      {showOnboarding && <StudentOnboarding toolbar={toolbar} />}
    </>
  );
}
