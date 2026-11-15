"use client";

import Link from "next/link";
import { useEffect } from "react";

import { badgeDefs, gameRepository, useGameState } from "@/entities/gamification";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icon";
import { IconTile } from "@/shared/ui/primitives";

const AUTO_HIDE_MS = 6000;

/** Yangi ochilgan nishon haqida bildirishnoma (o'ng pastki burchakda). */
export function AchievementToaster() {
  const { t, href } = useI18n();
  const game = useGameState();
  const id = game?.unseen[0];
  const badge = badgeDefs.find((b) => b.id === id);

  useEffect(() => {
    if (!id) return;
    const timer = window.setTimeout(() => gameRepository.markSeen([id]), AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [id]);

  if (!badge) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex justify-center sm:inset-x-auto sm:right-5 sm:bottom-5" role="status" aria-live="polite">
      <div key={badge.id} className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-4 rounded-3xl border border-border bg-surface p-4 shadow-lift">
        <IconTile tone={badge.tone} className="size-14 rounded-2xl">
          <Icon name={badge.icon} className="size-6" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-gold uppercase">{t.game.badgeUnlocked}</p>
          <p className="truncate font-bold">{t.badges[badge.id].title}</p>
          <Link href={href(routes.achievements)} onClick={() => gameRepository.markSeen([badge.id])} className="text-xs text-accent hover:underline">
            {t.game.viewAll}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => gameRepository.markSeen([badge.id])}
          aria-label={t.nav.close}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2"
        >
          <Icon name="x" className="size-4" />
        </button>
      </div>
    </div>
  );
}
