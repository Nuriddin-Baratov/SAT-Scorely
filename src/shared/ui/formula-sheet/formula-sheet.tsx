"use client";

import { useState } from "react";

import { cn } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

export type FormulaKey =
  | "circle"
  | "rectangle"
  | "triangle"
  | "pythagorean"
  | "special30"
  | "special45"
  | "prism"
  | "cylinder"
  | "sphere"
  | "cone"
  | "pyramid";

/** SAT Math bo'limidagi rasmiy formulalar varag'i (Reference sheet) mazmuni */
const formulas: { key: FormulaKey; lines: string[] }[] = [
  { key: "circle", lines: ["A = πr²", "C = 2πr"] },
  { key: "rectangle", lines: ["A = ℓw"] },
  { key: "triangle", lines: ["A = ½bh"] },
  { key: "pythagorean", lines: ["c² = a² + b²"] },
  { key: "special30", lines: ["x · x√3 · 2x"] },
  { key: "special45", lines: ["s · s · s√2"] },
  { key: "prism", lines: ["V = ℓwh"] },
  { key: "cylinder", lines: ["V = πr²h"] },
  { key: "sphere", lines: ["V = ⁴⁄₃πr³"] },
  { key: "cone", lines: ["V = ⅓πr²h"] },
  { key: "pyramid", lines: ["V = ⅓ℓwh"] },
];

/** Yig'iladigan formulalar varag'i — Bluebook'dagi “Reference” tugmasi kabi. */
export function FormulaSheet({
  labels,
  className,
}: {
  labels: { open: string; close: string; facts: string[] } & Record<FormulaKey, string>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-border bg-surface shadow-card", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-semibold"
      >
        <span className="grid size-8 place-items-center rounded-xl bg-gold-soft text-gold">
          <Icon name="book" className="size-4" />
        </span>
        {open ? labels.close : labels.open}
        <Icon name="chevronDown" className={cn("ml-auto size-4 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border p-5">
          <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {formulas.map((f) => (
              <div key={f.key} className="rounded-2xl bg-surface-2/60 px-4 py-3">
                <dt className="text-xs text-muted">{labels[f.key]}</dt>
                {f.lines.map((line) => (
                  <dd key={line} lang="en" className="mt-0.5 font-mono text-sm font-semibold">
                    {line}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
          <ul className="mt-4 space-y-1 text-xs text-muted">
            {labels.facts.map((fact) => (
              <li key={fact}>• {fact}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
