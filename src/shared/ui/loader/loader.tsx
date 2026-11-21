import { cn } from "@/shared/lib";

/**
 * Brend loader: SAT Pro logotipi, ichidagi o'sish chizig'i o'zini chizadi,
 * atrofida yumshoq to'lqin va pastda ingichka progress chizig'i.
 * Faqat transform/opacity/stroke animatsiya qilinadi — zaif qurilmalarda ham yengil.
 */
export function Loader({
  label,
  size = "md",
  className,
}: {
  /** Ekran o'quvchilar va ko'rinadigan matn uchun, masalan “Yuklanmoqda…” */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "size-11 rounded-[14px]" : "size-16 rounded-[18px]";
  const icon = size === "sm" ? "size-5" : "size-7";

  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-5", className)}>
      <div className="relative">
        <span className={cn("loader-halo absolute inset-0 bg-accent/40", box)} aria-hidden />
        <span
          className={cn(
            "relative grid place-items-center overflow-hidden bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1e40af] text-white shadow-[0_12px_30px_-10px_#2563eb]",
            box,
          )}
          aria-hidden
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.45),transparent_55%)]" />
          <svg viewBox="0 0 24 24" className={cn("relative", icon)} fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path className="loader-line" pathLength={100} d="M4 17l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
          </svg>
        </span>
      </div>

      {size === "md" && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-sm font-semibold tracking-wide text-muted">{label}</p>
          <span className="relative h-1 w-36 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <span className="loader-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-accent-2 via-accent to-gold" />
          </span>
        </div>
      )}
      {size === "sm" && <span className="sr-only">{label}</span>}
    </div>
  );
}
