"use client";

import type { ReactNode } from "react";

import { SyncManager } from "@/features/cloud-sync";
import { I18nProvider, type Locale } from "@/shared/i18n";
import { useServiceWorker } from "@/shared/lib/react";
import { ConfirmHost } from "@/shared/ui/confirm";

// Global providerlar: til, service worker va bulut sinxronizatsiyasi.
export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  useServiceWorker();
  return (
    <I18nProvider locale={locale}>
      {children}
      <SyncManager />
      <ConfirmHost />
    </I18nProvider>
  );
}
