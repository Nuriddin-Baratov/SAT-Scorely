"use client";

import { badgeDefs, bestStreak, currentStreak, levelOf, useGameState } from "@/entities/gamification";
import { DailyQuestion } from "@/features/daily-question";
import { localeTags, useI18n } from "@/shared/i18n";
import { addDays, cn, parseISODate, toISODate, weekdayIndex } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { Icon } from "@/shared/ui/icon";
import { Card, Container, IconTile, SectionHeading } from "@/shared/ui/primitives";

const WEEKS = 12;

export function AchievementsPage() {
  const { t, locale } = useI18n();
  const game = useGameState();
  const today = useToday();

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-12 sm:py-16">
        <SectionHeading eyebrow={t.achievements.eyebrow} title={t.achievements.title} description={t.achievements.description} />

        {!game || !today ? (
          <div className="mt-10 h-72 animate-pulse rounded-3xl bg-surface-2" />
        ) : (
          <Content game={game} today={today} locale={locale} />
        )}
      </Container>
    </main>
  );
}

function Content({
  game,
  today,
  locale,
}: {
  game: NonNullable<ReturnType<typeof useGameState>>;
  today: string;
  locale: keyof typeof localeTags;
}) {
  const { t } = useI18n();
  const level = levelOf(game.xp);
  const streak = currentStreak(game.activeDays, today);
  const best = bestStreak(game.activeDays);
  const unlocked = badgeDefs.filter((b) => game.badges[b.id]).length;
  const dateFormat = new Intl.DateTimeFormat(localeTags[locale], { day: "numeric", month: "short", year: "numeric" });

  // Faollik kalendari: oxirgi 12 hafta, ustun — hafta (Du…Ya)
  const active = new Set(game.activeDays);
  const end = parseISODate(today);
  const thisMonday = addDays(end, -weekdayIndex(end));
  const start = addDays(thisMonday, -(WEEKS - 1) * 7);
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = addDays(start, i);
    return { iso: toISODate(d), future: d > end };
  });
  const activeLast12 = days.filter((d) => active.has(d.iso)).length;

  return (
    <div className="mt-10 space-y-6">
      {/* Daraja */}
      <div className="noise relative overflow-hidden rounded-[1.75rem] bg-ink p-7 text-white shadow-lift sm:p-9">
        <div className="aurora opacity-70" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr_1fr] md:items-end">
          <div>
            <p className="text-sm text-white/60">
              {t.game.level} {level.index + 1}
            </p>
            <p className="mt-1 font-display text-4xl font-bold">{t.game.levels[level.index]}</p>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8b7dff] to-[#f1cf8b]" style={{ width: `${level.progress * 100}%` }} />
            </div>
            <p className="mt-2 text-sm text-white/60 tabular-nums">
              {game.xp} XP
              {level.next !== null ? ` · ${t.game.toNext(level.next - game.xp)}` : ` · ${t.game.maxLevel}`}
            </p>
          </div>
          <Stat icon="flame" value={streak} label={t.game.streak} sub={t.game.best(best)} />
          <Stat icon="medal" value={`${unlocked}/${badgeDefs.length}`} label={t.game.badges} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* Faollik kalendari */}
        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">{t.achievements.activity}</h2>
            <p className="text-sm text-muted">{t.achievements.activeDays(activeLast12)}</p>
          </div>
          <div
            className="mt-5 grid grid-flow-col grid-rows-7 gap-1.5"
            role="img"
            aria-label={t.achievements.activeDays(activeLast12)}
          >
            {days.map((d) => (
              <span
                key={d.iso}
                title={dateFormat.format(parseISODate(d.iso))}
                className={cn(
                  "aspect-square rounded-[5px]",
                  d.future ? "opacity-0" : active.has(d.iso) ? "bg-accent" : "bg-surface-2",
                  d.iso === today && "ring-2 ring-fg ring-offset-1 ring-offset-surface",
                )}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-surface-2 ring-1 ring-border" /> {t.achievements.inactive}</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] bg-accent" /> {t.achievements.active}</span>
          </div>

          <h3 className="mt-8 text-sm font-semibold">{t.achievements.howToEarn}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {t.achievements.xpRules.map((rule) => (
              <li key={rule} className="flex gap-2">
                <Icon name="star" className="mt-0.5 size-4 shrink-0 text-gold" /> {rule}
              </li>
            ))}
          </ul>
        </Card>

        {/* Nishonlar */}
        <Card className="p-6">
          <h2 className="text-lg font-bold">{t.game.badges}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {badgeDefs.map((b) => {
              const at = game.badges[b.id];
              return (
                <li
                  key={b.id}
                  className={cn("flex items-center gap-3 rounded-2xl border p-3.5", at ? "border-border bg-surface" : "border-dashed border-border bg-surface-2/40")}
                >
                  {at ? (
                    <IconTile tone={b.tone}>
                      <Icon name={b.icon} />
                    </IconTile>
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted">
                      <Icon name="lock" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", !at && "text-muted")}>{t.badges[b.id].title}</p>
                    <p className="text-xs text-muted">{at ? dateFormat.format(new Date(at)) : t.badges[b.id].text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <DailyQuestion className="pt-4" />
    </div>
  );
}

function Stat({ icon, value, label, sub }: { icon: "flame" | "medal"; value: number | string; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
      <Icon name={icon} className={cn("size-5", icon === "flame" ? "text-[#f5a54a]" : "text-[#f1cf8b]")} />
      <p className="mt-3 font-display text-4xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
      {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
    </div>
  );
}
