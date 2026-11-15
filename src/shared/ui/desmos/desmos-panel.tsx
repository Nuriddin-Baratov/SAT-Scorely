"use client";

import { useState } from "react";

import { cn } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

const DESMOS_LANGS = new Set(["en", "ru"]);

/**
 * Desmos grafik kalkulyatori (Bluebook ichidagidek) — yig'iladigan panel.
 * Iframe faqat birinchi ochilganda yuklanadi.
 */
export function DesmosPanel({
  locale,
  labels,
  className,
}: {
  locale: string;
  labels: { open: string; close: string; newTab: string; title: string };
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.desmos.com/calculator?lang=${DESMOS_LANGS.has(locale) ? locale : "en"}`;

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-border bg-surface shadow-card", className)}>
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setLoaded(true);
          }}
          aria-expanded={open}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-success-soft text-success">
            <Icon name="calculator" className="size-4" />
          </span>
          {open ? labels.close : labels.open}
          <Icon name="chevronDown" className={cn("size-4 text-muted transition", open && "rotate-180")} />
        </button>
        <a href={src} target="_blank" rel="noreferrer" className="text-xs text-muted hover:text-fg">
          {labels.newTab} ↗
        </a>
      </div>
      {loaded && (
        <iframe
          title={labels.title}
          src={src}
          className={cn("w-full border-t border-border", open ? "h-[420px]" : "hidden")}
          loading="lazy"
        />
      )}
    </div>
  );
}
