"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";

export interface ConfirmOptions {
  title: string;
  text?: string;
  /** Tasdiqlash tugmasi matni (standart — "Ha, davom etish") */
  confirm?: string;
  cancel?: string;
  /** `danger` — o'chirish kabi qaytarib bo'lmaydigan amallar */
  tone?: "accent" | "warning" | "danger";
  icon?: IconName;
}

interface Request extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

let current: Request | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/**
 * Sayt dizaynidagi tasdiqlash oynasi (brauzerning `window.confirm` o'rniga).
 * `if (!(await confirmDialog({ title: "…" }))) return;`
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...options, resolve };
    emit();
  });
}

function settle(ok: boolean) {
  const request = current;
  current = null;
  emit();
  request?.resolve(ok);
}

const toneClass = {
  accent: { tile: "bg-accent-soft text-accent", button: "" },
  warning: { tile: "bg-warning-soft text-warning", button: "" },
  danger: { tile: "bg-danger-soft text-danger", button: "bg-danger shadow-[0_8px_24px_-8px_var(--danger)]" },
} as const;

/** Ilova darajasida bir marta qo'yiladi (Providers) */
export function ConfirmHost() {
  const { t } = useI18n();
  const request = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (request && !el.open) el.showModal();
    if (!request && el.open) el.close();
  }, [request]);

  const tone = toneClass[request?.tone ?? "accent"];
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      // Esc yoki fon bosilsa — bekor
      onCancel={(e) => {
        e.preventDefault();
        settle(false);
      }}
      onClick={(e) => e.target === e.currentTarget && settle(false)}
      className="confirm-dialog m-auto w-[min(100%-2rem,26rem)] rounded-3xl border border-border bg-surface p-0 text-fg shadow-lift"
    >
      {request && (
        <div className="p-6 text-center sm:p-7">
          <span className={cn("mx-auto grid size-14 place-items-center rounded-2xl", tone.tile)}>
            <Icon name={request.icon ?? (request.tone === "danger" ? "trash" : request.tone === "warning" ? "flag" : "check")} className="size-6" />
          </span>
          <h2 id="confirm-title" className="mt-4 text-xl font-bold">
            {request.title}
          </h2>
          {request.text && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted">{request.text}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" className="h-12 w-full sm:w-auto sm:flex-1" onClick={() => settle(false)}>
              {request.cancel ?? t.confirm.cancel}
            </Button>
            <Button autoFocus className={cn("h-12 w-full sm:w-auto sm:flex-1", tone.button)} onClick={() => settle(true)}>
              {request.confirm ?? t.confirm.ok}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
