"use client";

import { useI18n } from "@/shared/i18n";
import { Loader } from "@/shared/ui/loader";

/** Sahifa yuklanayotganda (loading.tsx) — sidebar joyida qoladi, kontent o'rnida brend loader. */
export function RouteLoader() {
  const { t } = useI18n();
  return (
    <main className="relative flex min-h-[70vh] flex-1 items-center justify-center">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-40" aria-hidden />
      <Loader label={t.common.loading} className="relative" />
    </main>
  );
}
