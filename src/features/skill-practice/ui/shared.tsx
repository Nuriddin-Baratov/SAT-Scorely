"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { buttonClass } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: ReactNode }[] }) {
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-full border border-border bg-surface p-1 shadow-card">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition sm:px-5",
            o.value === value ? "bg-accent text-accent-fg shadow-[0_8px_24px_-10px_var(--accent)]" : "text-muted hover:text-fg",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pills<T extends string | number>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1 rounded-full bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn("h-8 rounded-full px-3 text-xs font-semibold transition", o.value === value ? "bg-surface text-accent shadow-card" : "text-muted hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** So'zlar: topilgani yashil, topilmagani qizil */
export function WordDiff({ words }: { words: { word: string; ok: boolean }[] }) {
  return (
    <p className="text-lg leading-relaxed sm:text-xl">
      {words.map((w, i) => (
        <span key={i} className={cn("mr-1.5 inline-block rounded-md px-0.5", w.ok ? "text-success" : "bg-danger-soft text-danger underline decoration-wavy underline-offset-4")}>
          {w.word}
        </span>
      ))}
    </p>
  );
}

export const levelTone = { B1: "success", B2: "accent", C1: "gold" } as const;

/**
 * Eski ilova (ovoz ko'prigi yo'q) — yangi APK'ni yuklab olish.
 * Eski ilova ichida fayl yuklab bo'lmaydi, shuning uchun havola Chrome'da (intent orqali) ochiladi.
 * Faqat brauzerda chiziladi (`outdatedApp` serverda doim `false`).
 */
export function UpdateAppNotice() {
  const { t } = useI18n();
  const host = window.location.host;
  const apk = `https://${host}/download/SAT-Pro.apk`;
  const intent = `intent://${host}/download/SAT-Pro.apk#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(apk)};end`;
  return (
    <div className="rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">
      <p className="flex items-start gap-2">
        <Icon name="flag" className="mt-0.5 size-4 shrink-0" />
        <span>{t.listening.updateApp}</span>
      </p>
      <a href={intent} className={buttonClass({ size: "sm" }, "mt-3 w-full sm:w-auto")}>
        <Icon name="download" className="size-4" />
        {t.install.downloadApk}
      </a>
    </div>
  );
}
