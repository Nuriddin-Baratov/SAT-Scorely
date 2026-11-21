"use client";

import { useEffect, useRef, useState } from "react";

import { formatDay, monthShort, useI18n, weekdayNames } from "@/shared/i18n";
import { addDays, cn, parseISODate, toISODate, weekdayIndex } from "@/shared/lib";

/* =====================================================================
 * GitHub uslubidagi statistika: faollik xaritasi, haftalik ustunlar,
 * bo'limlar ulushi va mavzular bo'yicha to'g'ri/xato chartlari.
 * Ranglar: R&W = --accent, Math = --series-math, xarita = --heat-0..4 (bitta ko'k shkala).
 * ===================================================================== */

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const LABEL_W = 22;

/** Kunlik qiymatni 0..4 darajaga (GitHub kabi kvartil bo'yicha) */
function levels(values: number[]) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (!sorted.length) return () => 0;
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const [a, b, c] = [q(0.25), q(0.5), q(0.75)];
  return (v: number) => (v <= 0 ? 0 : v <= a ? 1 : v <= b ? 2 : v <= c ? 3 : 4);
}

/** Konteyner kengligini kuzatadi (xarita ekranga sig'adigan haftalar sonini tanlaydi) */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export function ActivityHeatmap({ counts, today }: { counts: Record<string, number>; today: string }) {
  const { t, locale } = useI18n();
  const r = t.results;
  const { ref, width } = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Ekranga sig'adigan haftalar (telefonda ~20, kompyuterda 53 gacha)
  const weeks = width ? Math.max(8, Math.min(53, Math.floor((width - LABEL_W) / STEP))) : 0;
  const end = parseISODate(today);
  const start = addDays(end, -(weeks - 1) * 7 - weekdayIndex(end));

  const day = (iso: string) => formatDay(iso, locale);
  const weekdays = weekdayNames(locale);

  const cells: { iso: string; col: number; row: number; value: number; future: boolean }[] = [];
  for (let col = 0; col < weeks; col++) {
    for (let row = 0; row < 7; row++) {
      const d = addDays(start, col * 7 + row);
      const iso = toISODate(d);
      cells.push({ iso, col, row, value: counts[iso] ?? 0, future: iso > today });
    }
  }
  const level = levels(cells.map((c) => c.value));
  const total = cells.reduce((s, c) => s + c.value, 0);

  // Oy yorliqlari: oyning birinchi haftasi ustida (bir-birini bosmasligi uchun kamida 3 hafta oralig'i)
  const months: { col: number; label: string }[] = [];
  for (let col = 0; col < weeks; col++) {
    const d = addDays(start, col * 7);
    const prev = col > 0 ? addDays(start, (col - 1) * 7) : null;
    if ((!prev || prev.getMonth() !== d.getMonth()) && (!months.length || col - months[months.length - 1].col >= 3)) {
      months.push({ col, label: monthShort(d.getMonth(), locale) });
    }
  }

  const svgW = LABEL_W + weeks * STEP;
  const svgH = 16 + 7 * STEP;

  return (
    <div ref={ref} className="relative">
      <p className="mb-2 text-sm text-muted">{r.activitySummary(total, weeks)}</p>
      {weeks > 0 && (
        <svg
          width={svgW}
          height={svgH}
          role="img"
          aria-label={r.activitySummary(total, weeks)}
          className="block max-w-full overflow-visible"
          onMouseLeave={() => setTip(null)}
        >
          {months.map((m) => (
            <text key={m.col} x={LABEL_W + m.col * STEP} y={10} className="fill-muted text-[10px]">
              {m.label}
            </text>
          ))}
          {[0, 2, 4].map((row) => (
            <text key={row} x={0} y={16 + row * STEP + CELL - 2} className="fill-muted text-[9px]">
              {weekdays[row].slice(0, 2)}
            </text>
          ))}
          {cells.map((c) =>
            c.future ? null : (
              <rect
                key={c.iso}
                x={LABEL_W + c.col * STEP}
                y={16 + c.row * STEP}
                width={CELL}
                height={CELL}
                rx={3}
                fill={`var(--heat-${level(c.value)})`}
                stroke={c.iso === today ? "var(--fg)" : "none"}
                strokeWidth={c.iso === today ? 1 : 0}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setTip({ x: LABEL_W + c.col * STEP + CELL / 2, y: 16 + c.row * STEP, text: r.activityTip(c.value, day(c.iso)) })
                }
                onClick={() =>
                  setTip({ x: LABEL_W + c.col * STEP + CELL / 2, y: 16 + c.row * STEP, text: r.activityTip(c.value, day(c.iso)) })
                }
              >
                <title>{r.activityTip(c.value, day(c.iso))}</title>
              </rect>
            ),
          )}
        </svg>
      )}
      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-fg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-bg shadow-lift"
          style={{ left: Math.min(Math.max(tip.x, 60), Math.max(60, width - 60)), top: tip.y + 14 }}
        >
          {tip.text}
        </div>
      )}
      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted">
        {r.less}
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="size-[10px] rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
        ))}
        {r.more}
      </div>
    </div>
  );
}

/** Haftalik faollik: ustunli chart, y-o'qi, to'r chiziqlari, hover tooltip */
export function WeeklyBars({ counts, today, weeks = 12 }: { counts: Record<string, number>; today: string; weeks?: number }) {
  const { t, locale } = useI18n();
  const r = t.results;
  const [hover, setHover] = useState<number | null>(null);
  const fmt = { format: (d: Date) => formatDay(toISODate(d), locale) };

  const end = parseISODate(today);
  const firstMonday = addDays(end, -weekdayIndex(end) - (weeks - 1) * 7);
  const data = Array.from({ length: weeks }, (_, w) => {
    const from = addDays(firstMonday, w * 7);
    let sum = 0;
    for (let d = 0; d < 7; d++) sum += counts[toISODate(addDays(from, d))] ?? 0;
    return { from, sum };
  });
  const max = Math.max(4, ...data.map((d) => d.sum));
  // Chiroyli y-o'qi: 0, yarmi, yuqorisi (yaxlitlangan)
  const top = Math.ceil(max / 5) * 5;
  const ticks = [0, top / 2, top];

  const W = 320;
  const H = 140;
  const PAD = { l: 26, r: 4, t: 8, b: 20 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const slot = innerW / weeks;
  const barW = Math.max(6, slot - 4); // ustunlar orasida 4px bo'shliq
  const y = (v: number) => PAD.t + innerH - (v / top) * innerH;
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={r.weeklyTitle} onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray={v === 0 ? undefined : "2 3"} />
            <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fill-muted text-[9px] tabular-nums">
              {v}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.l + i * slot + (slot - barW) / 2;
          const h = Math.max(d.sum ? 3 : 0, y(0) - y(d.sum));
          return (
            <g key={i}>
              {/* Kattaroq bosish maydoni */}
              <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
              {h > 0 && (
                <path
                  d={`M${x} ${y(0)} V${y(0) - h + 4} Q${x} ${y(0) - h} ${x + 4} ${y(0) - h} H${x + barW - 4} Q${x + barW} ${y(0) - h} ${x + barW} ${y(0) - h + 4} V${y(0)} Z`}
                  fill="var(--accent)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  className="pointer-events-none transition-opacity"
                />
              )}
            </g>
          );
        })}
        {[0, Math.floor(weeks / 2), weeks - 1].map((i) => (
          <text key={i} x={PAD.l + i * slot + slot / 2} y={H - 5} textAnchor="middle" className="fill-muted text-[9px]">
            {fmt.format(data[i].from)}
          </text>
        ))}
      </svg>
      {active && (
        <div className="pointer-events-none absolute top-0 right-0 rounded-lg bg-fg px-2.5 py-1.5 text-xs whitespace-nowrap text-bg shadow-lift">
          <span className="font-semibold">{r.questionsN(active.sum)}</span> · {r.weekOf(fmt.format(active.from))}
        </div>
      )}
    </div>
  );
}

/** GitHub "Languages" chizig'i: bo'limlar ulushi (segmentlar orasida 2px bo'shliq) + afsona */
export function SectionSplit({ rw, math }: { rw: number; math: number }) {
  const total = rw + math;
  if (!total) return null;
  const parts = [
    { key: "rw", label: "Reading & Writing", value: rw, color: "var(--accent)" },
    { key: "math", label: "Math", value: math, color: "var(--series-math)" },
  ].filter((p) => p.value > 0);
  return (
    <div>
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        {parts.map((p) => (
          <span key={p.key} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} className="first:rounded-l-full last:rounded-r-full" />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            <span className="font-semibold">{p.label}</span>
            <span className="text-muted tabular-nums">{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface DomainRow {
  id: string;
  label: string;
  section: "rw" | "math";
  correct: number;
  total: number;
}

/**
 * Mavzular: har bir qator — to'g'ri (bo'lim rangi) + xato (neytral) ulushli chiziq,
 * 80% maqsad chizig'i va o'ngda aniqlik foizi. Bo'limlar bo'yicha guruhlangan.
 */
export function DomainChart({ rows }: { rows: DomainRow[] }) {
  const { t } = useI18n();
  const r = t.results;
  const groups = (["rw", "math"] as const)
    .map((section) => ({ section, items: rows.filter((d) => d.section === section).sort((a, b) => b.correct / b.total - a.correct / a.total) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.section}>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
            <span className="size-2 rounded-full" style={{ background: g.section === "rw" ? "var(--accent)" : "var(--series-math)" }} />
            {g.section === "rw" ? "Reading & Writing" : "Math"}
          </p>
          <ul className="space-y-2.5">
            {g.items.map((d) => {
              const pct = Math.round((d.correct / d.total) * 100);
              const wrong = d.total - d.correct;
              return (
                <li key={d.id} title={r.correctWrong(d.correct, wrong)}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{d.label}</span>
                    <span className={cn("shrink-0 font-semibold tabular-nums", pct < 50 && "text-danger")}>{pct}%</span>
                  </div>
                  <div className="relative mt-1 flex h-2 gap-[2px]">
                    {d.correct > 0 && (
                      <span
                        className="rounded-l-[4px] last:rounded-r-[4px]"
                        style={{ width: `${pct}%`, background: d.section === "rw" ? "var(--accent)" : "var(--series-math)" }}
                      />
                    )}
                    {wrong > 0 && <span className="flex-1 rounded-r-[4px] bg-surface-2 first:rounded-l-[4px]" />}
                    {/* 80% maqsad */}
                    <span className="absolute -top-0.5 -bottom-0.5 left-[80%] w-px bg-fg/40" aria-hidden />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
