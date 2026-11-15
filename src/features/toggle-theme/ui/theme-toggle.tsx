"use client";

import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Icon, type IconName } from "@/shared/ui/icon";

import { setTheme, useTheme, type ThemeMode } from "../model/theme";

const modes: { mode: ThemeMode; icon: IconName }[] = [
  { mode: "light", icon: "sun" },
  { mode: "system", icon: "monitor" },
  { mode: "dark", icon: "moon" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const current = useTheme() ?? "system";

  return (
    <div role="radiogroup" aria-label={t.theme.label} className={cn("flex rounded-2xl bg-surface-2 p-1", className)}>
      {modes.map(({ mode, icon }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={current === mode}
          title={t.theme[mode]}
          aria-label={t.theme[mode]}
          onClick={() => setTheme(mode)}
          className={cn(
            "grid h-8 flex-1 place-items-center rounded-xl transition",
            current === mode ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
          )}
        >
          <Icon name={icon} className="size-4" />
        </button>
      ))}
    </div>
  );
}
