"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { useI18n } from "@/shared/i18n";
import { cn, formatDuration } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

/**
 * Taymer alohida komponentda: har soniyada faqat shu kichik qism qayta chiziladi,
 * savol kartasi, Desmos va navigator esa qayta render bo'lmaydi.
 */
export function Countdown({ startedAt, limitMs, onExpire }: { startedAt: number; limitMs: number; onExpire: () => void }) {
  const { t } = useI18n();
  const [now, setNow] = useState<number | null>(null);
  const expire = useEffectEvent(onExpire);

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current - startedAt >= limitMs) {
        window.clearInterval(id);
        expire();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, limitMs]);

  const remainingMs = now === null ? limitMs : Math.max(0, limitMs - (now - startedAt));

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-sm font-semibold tabular-nums",
        remainingMs <= 60_000 ? "bg-danger-soft text-danger" : "bg-surface-2",
      )}
      role="timer"
      aria-label={t.runner.timeLeft}
    >
      <Icon name="clock" className="size-4" />
      {formatDuration(Math.ceil(remainingMs / 1000))}
    </div>
  );
}
