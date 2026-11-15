"use client";

import { useState } from "react";

export interface ChartPoint {
  label: string;
  date: string;
  value: number;
}

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
const TICKS = [0, 25, 50, 75, 100];

/**
 * Bitta qatorli chiziqli grafik (aniqlik %, vaqt bo'yicha).
 * Legend yo'q (bitta seriya — sarlavha nomlaydi), hover'da crosshair + tooltip.
 */
export function ProgressChart({ points, valueLabel }: { points: ChartPoint[]; valueLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / 100) * innerH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const active = hover !== null ? points[hover] : null;

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
    });
    setHover(nearest);
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none overflow-visible"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={valueLabel}
      >
        {TICKS.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--border)" strokeDasharray={tick ? "3 4" : undefined} />
            <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {tick}%
            </text>
          </g>
        ))}

        {active && hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--muted)" strokeOpacity="0.5" />
        )}

        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle
            key={`${p.date}-${i}`}
            cx={x(i)}
            cy={y(p.value)}
            r={hover === i ? 6 : 4}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}

        {points.length > 1 && (
          <>
            <text x={x(0)} y={H - 6} textAnchor="start" className="fill-muted text-[11px]">
              {points[0].date}
            </text>
            <text x={x(points.length - 1)} y={H - 6} textAnchor="end" className="fill-muted text-[11px]">
              {points[points.length - 1].date}
            </text>
          </>
        )}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lift"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(active.value) / H) * 100}%`, marginTop: -10 }}
        >
          <p className="font-semibold whitespace-nowrap">{active.label}</p>
          <p className="whitespace-nowrap text-muted">
            {active.date} · <span className="font-semibold text-fg tabular-nums">{active.value}%</span>
          </p>
        </div>
      )}
    </div>
  );
}
