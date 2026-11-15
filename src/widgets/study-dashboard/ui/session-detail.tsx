"use client";

import { getSessionSkill, sessionKindLabels, SessionKindIcon, type PlanSession } from "@/entities/study-plan";
import { CompleteButton } from "@/features/track-progress";
import { formatDay, useI18n, weekdayNames } from "@/shared/i18n";
import { parseISODate, weekdayIndex } from "@/shared/lib";
import { Badge } from "@/shared/ui/primitives";

export function SessionDetail({ session, done }: { session: PlanSession; done: boolean }) {
  const { t, locale } = useI18n();
  const d = t.dashboard;
  const skill = getSessionSkill(session, locale);
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <SessionKindIcon kind={session.kind} className="size-12" />
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{sessionKindLabels(locale)[session.kind]}</Badge>
            <Badge>{weekdayNames(locale, "long")[weekdayIndex(parseISODate(session.date))]}, {formatDay(session.date, locale)}</Badge>
            <Badge>{session.minutes} {t.common.min}</Badge>
            {done && <Badge tone="success">{d.completed}</Badge>}
          </div>
          <h3 className="mt-3 font-display text-3xl leading-tight">{session.title}</h3>
          <p className="text-sm text-muted">{session.subtitle}</p>
        </div>
      </div>

      <section>
        <h4 className="text-sm font-semibold">{d.sessionPlan}</h4>
        <ol className="mt-3 space-y-2">
          {session.blocks.map((block, i) => (
            <li key={block.label} className="flex gap-4 rounded-2xl border border-border bg-bg p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{block.label}</p>
                  <span className="shrink-0 text-xs text-muted">{block.minutes} {t.common.min}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{block.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {skill && (
        <>
          <section className="rounded-2xl bg-accent-soft p-5">
            <h4 className="text-sm font-semibold text-accent">{d.strategies}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {skill.strategies.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-warning-soft p-5">
            <h4 className="text-sm font-semibold text-warning">{t.guide.traps}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {skill.traps.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-warning">!</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {(session.kind === "diagnostic" || session.kind === "practice-test") && (
        <p className="rounded-2xl bg-gold-soft p-4 text-sm text-gold">
          {d.bluebookNote}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-5">
        <CompleteButton sessionId={session.id} done={done} />
      </div>
    </div>
  );
}
