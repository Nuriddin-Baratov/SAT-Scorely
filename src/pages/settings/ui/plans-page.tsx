"use client";

import { useEffect, useState } from "react";

import type { TutorStatus } from "@/features/ai-tutor";
import { routes } from "@/shared/config";
import { formatDay, useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, Container, SectionHeading } from "@/shared/ui/primitives";

export function PlansPage() {
  const { t, locale, href } = useI18n();
  const tp = t.plans;
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [note, setNote] = useState(false);

  useEffect(() => {
    fetch("/api/tutor", { cache: "no-store" })
      .then((r) => r.json() as Promise<TutorStatus>)
      .then(setStatus)
      .catch(() => {});
  }, []);

  const plan = status?.user ? status.plan ?? "free" : null;
  const plans = [
    { id: "free" as const, ...tp.free, icon: "book" as const },
    { id: "pro" as const, ...tp.pro, icon: "crown" as const },
  ];

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-14">
        <SectionHeading eyebrow={tp.eyebrow} title={tp.title} description={tp.description} />

        <div className="mt-6 grid gap-4 sm:mt-10 md:grid-cols-2 lg:gap-6">
          {plans.map((p) => {
            const pro = p.id === "pro";
            const current = plan === p.id;
            return (
              <Card
                key={p.id}
                className={cn(
                  "relative flex flex-col overflow-hidden p-6 sm:p-8",
                  pro && "border-transparent bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6] text-white shadow-lift",
                )}
              >
                {pro && <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden />}
                <div className="relative flex items-center gap-3">
                  <span className={cn("grid size-12 place-items-center rounded-2xl", pro ? "bg-white/15 text-white" : "bg-accent-soft text-accent")}>
                    <Icon name={p.icon} className="size-6" />
                  </span>
                  <p className="font-display text-2xl font-bold">{p.name}</p>
                  <div className="ml-auto flex gap-2">
                    {pro && !current && <Badge className="bg-white/15 text-white">{tp.popular}</Badge>}
                    {current && (
                      <Badge tone={pro ? "neutral" : "success"} className={pro ? "bg-white text-[#1d4ed8]" : undefined}>
                        <Icon name="check" className="size-3" />
                        {tp.current}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="relative mt-6">
                  <span className="font-display text-4xl font-bold sm:text-5xl">{p.price}</span>
                  {pro && <span className="ml-1 text-white/70">{tp.perMonth}</span>}
                </p>
                {pro && current && status?.planUntil && <p className="relative mt-1 text-sm text-white/80">{tp.until(formatDay(status.planUntil.slice(0, 10), locale, true))}</p>}
                <ul className="relative mt-6 flex-1 space-y-3">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", pro ? "bg-white/20 text-white" : "bg-success-soft text-success")}>
                        <Icon name="check" className="size-3" />
                      </span>
                      <span className={pro ? "text-white/90" : undefined}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="relative mt-8">
                  {pro ? (
                    current ? null : (
                      <Button className="h-12 w-full bg-white! text-[#1d4ed8]! shadow-none! hover:brightness-95" onClick={() => setNote(true)}>
                        <Icon name="crown" className="size-4" />
                        {tp.soon}
                      </Button>
                    )
                  ) : (
                    !current && (
                      <ButtonLink href={href(plan ? routes.dashboard : routes.login)} variant="outline" className="h-12 w-full">
                        {plan ? t.nav.dashboard : t.auth.login}
                        <Icon name="arrowRight" className="size-4" />
                      </ButtonLink>
                    )
                  )}
                  {pro && note && <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm text-white">{tp.soonNote}</p>}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-6">
          {tp.faq.map((f) => (
            <Card key={f.q} className="p-5 sm:p-6">
              <p className="font-semibold">{f.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
