"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(100%-2rem,42rem)] max-h-[88vh] overflow-y-auto rounded-3xl border border-border bg-surface p-0 text-fg shadow-card"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface/95 px-6 py-4 backdrop-blur">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
          aria-label="Yopish"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-6">{open && children}</div>
    </dialog>
  );
}
