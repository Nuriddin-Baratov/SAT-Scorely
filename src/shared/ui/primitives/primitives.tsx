import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-surface shadow-card sm:rounded-3xl", className)}
      {...props}
    />
  );
}

type Tone = "neutral" | "accent" | "gold" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  gold: "bg-gold-soft text-gold",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent before:h-px before:w-5 before:bg-current sm:text-xs",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Rangli ikonka “plitkasi”. */
export function IconTile({
  children,
  tone = "accent",
  className,
}: {
  children: ReactNode;
  tone?: "accent" | "gold" | "success" | "warning" | "ink";
  className?: string;
}) {
  const map = {
    accent: "bg-accent-soft text-accent ring-accent/15",
    gold: "bg-gold-soft text-gold ring-gold/20",
    success: "bg-success-soft text-success ring-success/15",
    warning: "bg-warning-soft text-warning ring-warning/15",
    ink: "bg-white/10 text-white ring-white/15",
  };
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset", map[tone], className)}>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-2 font-display text-[1.75rem] leading-tight font-bold sm:mt-4 sm:text-5xl sm:leading-[1.05]">{title}</h2>
      {/* Mobilda tavsif 2 qator — asosiy kontent birinchi ekranda ko'rinsin */}
      {description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted sm:mt-4 sm:line-clamp-none sm:text-lg">{description}</p>}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "accent",
  label,
}: {
  value: number;
  className?: string;
  tone?: "accent" | "gold" | "success";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color = tone === "gold" ? "bg-gold" : tone === "success" ? "bg-success" : "bg-accent";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-700", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 96, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}
