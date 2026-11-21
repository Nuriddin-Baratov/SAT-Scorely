"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

/**
 * Qo'llanma bo'limi: telefonda yig'ma (faqat sarlavha ko'rinadi — sahifa qisqa),
 * katta ekranda doim ochiq. Mundarijadagi havola (#id) bosilsa — bo'lim o'zi ochiladi.
 */
export function GuideFold({ id, heading, children }: { id: string; heading: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === `#${id}`) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [id]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-card lg:space-y-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="flex w-full items-center gap-3 text-left lg:pointer-events-none"
      >
        <div className="min-w-0 flex-1">{heading}</div>
        <Icon name="chevronDown" className={cn("size-5 shrink-0 text-muted transition lg:hidden", open && "rotate-180")} />
      </button>
      <div id={`${id}-body`} className={cn("mt-4 space-y-6 lg:mt-0 lg:block lg:space-y-8", open ? "block" : "hidden")}>
        {children}
      </div>
    </section>
  );
}
