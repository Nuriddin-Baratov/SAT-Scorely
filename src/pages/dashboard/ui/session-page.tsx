"use client";

import { findNextSession, useCompletedSessions } from "@/entities/study-plan";
import { useStudentProfile, type StudentProfile } from "@/entities/student";
import { SessionPlayer, useStudyPlan } from "@/widgets/study-dashboard";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { useToday } from "@/shared/lib/react";
import { ButtonLink } from "@/shared/ui/button";
import { Card, Container } from "@/shared/ui/primitives";

/** Reja mashg'ulotini o'tkazish sahifasi: `/session?id=…` */
export function SessionPage({ id }: { id: string }) {
  const profile = useStudentProfile();
  return (
    <main className="flex-1">
      <Container className="max-w-3xl py-4 sm:py-10">{profile ? <Player profile={profile} id={id} /> : <div className="h-64" aria-busy />}</Container>
    </main>
  );
}

function Player({ profile, id }: { profile: StudentProfile; id: string }) {
  const { t, href } = useI18n();
  const { plan } = useStudyPlan(profile);
  const completed = useCompletedSessions();
  const today = useToday();
  const session = plan.sessions.find((s) => s.id === id);
  if (!session) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <p className="font-semibold">{t.session.notFound}</p>
        <ButtonLink href={href(routes.dashboard)}>{t.nav.dashboard}</ButtonLink>
      </Card>
    );
  }
  const next = completed && today ? findNextSession(plan, [...completed, session.id], today) : null;
  return <SessionPlayer key={session.id} session={session} next={next && next.id !== session.id ? next : null} />;
}
