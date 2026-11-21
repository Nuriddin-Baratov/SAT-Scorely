"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/shared/lib";

/** Element ekranga birinchi marta ko'ringanda `true` bo'ladi (animatsiyani boshlash uchun). */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

/** Raqamni 0 dan qiymatgacha silliq sanaydi. */
export function CountUp({ value, run, delay = 0, suffix = "" }: { value: number; run: boolean; delay?: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / 1100));
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, run, delay]);
  return (
    <span className="tabular-nums">
      {shown}
      {suffix}
    </span>
  );
}

export type MeterTone = "good" | "mid" | "low";
export const toneOf = (pct: number): MeterTone => (pct >= 80 ? "good" : pct >= 50 ? "mid" : "low");

const fill: Record<MeterTone, string> = {
  good: "from-emerald-500 via-emerald-400 to-teal-300 shadow-[0_0_14px_rgb(52_211_153/0.55)]",
  mid: "from-amber-500 via-[#93c5fd] to-[#dbeafe] shadow-[0_0_14px_rgb(245_199_107/0.5)]",
  low: "from-rose-600 via-rose-500 to-orange-400 shadow-[0_0_14px_rgb(244_63_94/0.5)]",
};

/**
 * Animatsiyali progress chizig'i: ko'ringanda o'sib chiqadi, ichidan nur o'tadi.
 * `marker` — maqsad belgisi (0–100, masalan SAT'dagi o'rtacha vaqt).
 */
export function Meter({
  value,
  tone,
  run,
  delay = 0,
  marker,
  markerLabel,
}: {
  value: number;
  tone: MeterTone;
  run: boolean;
  delay?: number;
  marker?: number;
  markerLabel?: string;
}) {
  return (
    <div
      className={cn("meter relative h-3 rounded-full bg-surface-2 shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)]", run && "meter-run")}
      style={{ "--d": `${delay}ms` } as CSSProperties}
    >
      <div
        className={cn("meter-fill relative h-full overflow-hidden rounded-full bg-gradient-to-r", fill[tone])}
        style={{ width: `${Math.min(100, Math.max(value, 3))}%` }}
      />
      {marker !== undefined && (
        <span className="meter-marker absolute -top-1.5 -bottom-1.5 w-0.5" style={{ left: `${marker}%` }} title={markerLabel} aria-hidden>
          <span className="absolute inset-0 rounded-full bg-[#93c5fd]" />
          <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#93c5fd] shadow-[0_0_10px_#93c5fd]" />
        </span>
      )}
    </div>
  );
}
