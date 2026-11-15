"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib";
import { localeNames, locales, localizePath, stripLocale, useI18n, type Locale } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icon";

export function LocaleSwitcher({
  className,
  onSwitch,
  placement = "down",
  block = false,
}: {
  className?: string;
  onSwitch?: () => void;
  /** Ro'yxat qaysi tomonga ochiladi */
  placement?: "down" | "up";
  /** To'liq kenglikdagi tugma (sidebar pastida) */
  block?: boolean;
}) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    onSwitch?.();
    if (next === locale) return;
    router.push(`${localizePath(next, stripLocale(pathname))}${window.location.search}${window.location.hash}`);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.switcher.label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-fg",
          block ? "h-11 w-full rounded-2xl border border-border px-3.5" : "h-9 rounded-full px-3 uppercase",
        )}
      >
        <Icon name="globe" className="size-4" />
        {block ? <span className="flex-1 text-left text-fg">{localeNames[locale]}</span> : locale}
        <Icon
          name="chevronDown"
          className={cn("size-3.5 transition", (placement === "up") !== open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t.switcher.label}
          className={cn(
            "absolute z-50 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-lift",
            placement === "up" ? "bottom-full mb-2" : "mt-2",
            block ? "inset-x-0" : "right-0 w-44",
          )}
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                lang={l}
                onClick={() => choose(l)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                  l === locale ? "bg-surface-2 font-semibold text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <span>
                  <span className="mr-2 inline-block w-6 text-xs font-bold uppercase opacity-60">{l}</span>
                  {localeNames[l]}
                </span>
                {l === locale && <Icon name="check" className="size-4 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
