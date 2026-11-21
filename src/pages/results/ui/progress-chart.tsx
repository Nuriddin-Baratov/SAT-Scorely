"use client";

import { useState, type CSSProperties } from "react";

import { cn } from "@/shared/lib";

import { toneOf, useInView } from "./meter";

export interface ChartPoint {
  label: string;
  date: string;
  value: number;
}

const W = 640;
const H = 240;
const PAD = { top: 28, right: 20, bottom: 30, left: 40 };
const TICKS = [0, 25, 50, 75, 100];
const DRAW_MS = 1400;
const dotColor = { good: "#34d399", mid: "#93c5fd", low: "#fb7185" } as const;

/** Silliq egri chiziq (Catmull-Rom → Bezier); boshqaruv nuqtalari grafik chegarasidan chiqmaydi. */
function smoothPath(pts: { x: number; y: number }[], minY: number, maxY: number) {
  if (pts.length < 2) return "";
  const clamp = (v: number) => Math.min(maxY, Math.max(minY, v));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clamp(p1.y + (p2.y - p0.y) / 6) };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clamp(p2.y - (p3.y - p1.y) / 6) };
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Aniqlik dinamikasi: ko'ringanda chiziq o'zini chizadi, nuqtalar ketma-ket chiqadi,
 * hover'da crosshair va tooltip. `avgLabel` berilsa — o'rtacha qiymat chizig'i.
 */
export function ProgressChart({ points, valueLabel, avgLabel }: { points: ChartPoint[]; valueLabel: string; avgLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>();
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const bottom = PAD.top + innerH;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / 100) * innerH;
  const pts = points.map((p, i) => ({ x: x(i), y: y(p.value) }));
  const line = smoothPath(pts, PAD.top, bottom);
  const area = line && `${line} L${x(points.length - 1).toFixed(1)} ${bottom} L${x(0).toFixed(1)} ${bottom} Z`;
  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.value, 0) / points.length) : 0;
  const showValues = points.length <= 12;
  const showDates = points.length <= 8;
  const active = hover !== null ? points[hover] : null;
  // Nuqta chiziq yetib kelganda paydo bo'ladi
  const delayOf = (i: number) => (points.length > 1 ? (i / (points.length - 1)) * DRAW_MS : 0);

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
    <div ref={ref} className={cn("chart relative", inView && "chart-run")} style={{ "--draw": `${DRAW_MS}ms` } as CSSProperties}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none overflow-visible"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={valueLabel}
      >
        <defs>
          <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#60a5fa" stopOpacity="0.35" />
            <stop offset="0.6" stopColor="#60a5fa" stopOpacity="0.1" />
            <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          {/* userSpaceOnUse — chiziq to'liq gorizontal bo'lsa ham ko'rinadi */}
          <linearGradient id="chart-line" gradientUnits="userSpaceOnUse" x1={PAD.left} y1="0" x2={W - PAD.right} y2="0">
            <stop offset="0" stopColor="#60a5fa" />
            <stop offset="0.55" stopColor="#bfdbfe" />
            <stop offset="1" stopColor="#93c5fd" />
          </linearGradient>
          <filter id="chart-glow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* To'r */}
        {TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeOpacity={tick ? 0.6 : 1}
              strokeDasharray={tick ? "2 6" : undefined}
            />
            <text x={PAD.left - 10} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {tick}%
            </text>
          </g>
        ))}

        {/* O'rtacha qiymat */}
        {avgLabel && points.length > 1 && (
          <g className="chart-fade">
            <line x1={PAD.left} x2={W - PAD.right} y1={y(avg)} y2={y(avg)} stroke="#93c5fd" strokeOpacity="0.55" strokeDasharray="6 5" />
            <text x={W - PAD.right} y={y(avg) - 6} textAnchor="end" className="fill-[#93c5fd] text-[10px] font-semibold">
              {avgLabel} · {avg}%
            </text>
          </g>
        )}

        {area && <path d={area} fill="url(#chart-area)" className="chart-area" />}
        {line && (
          <>
            <path d={line} fill="none" stroke="url(#chart-line)" strokeWidth="8" strokeOpacity="0.45" filter="url(#chart-glow)" pathLength={1} className="chart-line" />
            <path d={line} fill="none" stroke="url(#chart-line)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="chart-line" />
          </>
        )}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={bottom} stroke="var(--muted)" strokeOpacity="0.45" strokeDasharray="3 4" />
        )}

        {points.map((p, i) => {
          const color = dotColor[toneOf(p.value)];
          const last = i === points.length - 1;
          const style = { "--pd": `${delayOf(i)}ms` } as CSSProperties;
          return (
            <g key={`${p.date}-${i}`} className="chart-point" style={style}>
              {last && <circle cx={x(i)} cy={y(p.value)} r="7" fill={color} className="chart-pulse" />}
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={hover === i ? 7.5 : 5.5}
                fill={color}
                stroke="var(--surface)"
                strokeWidth="2.5"
                className="transition-[r] duration-200"
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
              {showValues && (
                <text x={x(i)} y={y(p.value) - 14} textAnchor="middle" className="fill-fg text-[11px] font-bold tabular-nums">
                  {p.value}%
                </text>
              )}
            </g>
          );
        })}

        {/* Sanalar */}
        {(showDates ? points.map((_, i) => i) : points.length > 1 ? [0, points.length - 1] : [0]).map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            textAnchor={points.length === 1 ? "middle" : i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            className={cn("text-[11px]", hover === i ? "fill-fg font-semibold" : "fill-muted")}
          >
            {points[i].date}
          </text>
        ))}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-2xl border border-border bg-surface/95 px-3.5 py-2.5 text-xs shadow-lift backdrop-blur"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(active.value) / H) * 100}%`, marginTop: -16 }}
        >
          <p className="max-w-56 truncate font-semibold">{active.label}</p>
          <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-muted">
            <span className="size-2 rounded-full" style={{ background: dotColor[toneOf(active.value)] }} />
            {active.date} · <span className="font-bold text-fg tabular-nums">{active.value}%</span>
          </p>
        </div>
      )}
    </div>
  );
}
