"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { DomainId } from "@/entities/sat";
import { useSession } from "@/entities/user";
import { api } from "@/shared/api";
import { routes } from "@/shared/config";
import { formatDay, useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, Container, SectionHeading } from "@/shared/ui/primitives";

interface Member {
  userId: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  accuracy: number | null;
  questions: number;
  weakDomain: string | null;
  lastActive: string | null;
}

interface TeacherClass {
  id: string;
  name: string;
  code: string;
  members: Member[];
}

export function TeacherPage() {
  const { t, href } = useI18n();
  const c = t.classes;
  const session = useSession();
  const [classes, setClasses] = useState<TeacherClass[] | null>(null);
  const isTeacher = session.status === "user" && session.user.role === "teacher";

  const load = useCallback(async () => {
    const data = await api<{ classes: TeacherClass[] }>("/api/classes", { cache: "no-store" });
    setClasses(data.classes);
  }, []);

  useEffect(() => {
    if (!isTeacher) return;
    let cancelled = false;
    api<{ classes: TeacherClass[] }>("/api/classes", { cache: "no-store" })
      .then((d) => !cancelled && setClasses(d.classes))
      .catch(() => !cancelled && setClasses([]));
    return () => {
      cancelled = true;
    };
  }, [isTeacher]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await api("/api/classes", { method: "POST", json: { name: String(new FormData(form).get("name") ?? "") } });
    form.reset();
    await load();
  }

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-12 sm:py-16">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} description={c.description} />

        {session.status === "loading" ? (
          <div className="mt-10 h-64 animate-pulse rounded-3xl bg-surface-2" />
        ) : !isTeacher ? (
          <Card className="mt-10 flex flex-col items-start gap-4 p-8">
            <p className="text-muted">{session.status === "user" ? c.onlyTeachers : c.loginFirst}</p>
            <ButtonLink href={href(session.status === "user" ? routes.settings : routes.login)}>
              {session.status === "user" ? t.nav.settings : t.auth.login}
            </ButtonLink>
          </Card>
        ) : (
          <div className="mt-10 space-y-6">
            <Card className="p-6">
              <form onSubmit={create} className="flex flex-wrap items-end gap-3">
                <label className="min-w-56 flex-1 text-sm font-medium">
                  {c.newClass}
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={60}
                    placeholder={c.namePlaceholder}
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-bg px-4 outline-none focus:border-accent"
                  />
                </label>
                <Button type="submit">
                  <Icon name="sparkles" className="size-4" /> {c.create}
                </Button>
              </form>
            </Card>

            {classes === null ? (
              <div className="h-64 animate-pulse rounded-3xl bg-surface-2" />
            ) : classes.length === 0 ? (
              <p className="py-10 text-center text-muted">{c.noClasses}</p>
            ) : (
              classes.map((cls) => <ClassCard key={cls.id} cls={cls} onChange={load} />)
            )}
          </div>
        )}
      </Container>
    </main>
  );
}

function ClassCard({ cls, onChange }: { cls: TeacherClass; onChange: () => Promise<void> }) {
  const { t, locale } = useI18n();
  const c = t.classes;
  const [copied, setCopied] = useState(false);
  const withData = cls.members.filter((m) => m.accuracy !== null);
  const avgAccuracy = withData.length ? withData.reduce((s, m) => s + (m.accuracy ?? 0), 0) / withData.length : null;
  const weakCounts = new Map<string, number>();
  cls.members.forEach((m) => m.weakDomain && weakCounts.set(m.weakDomain, (weakCounts.get(m.weakDomain) ?? 0) + 1));
  const commonWeak = [...weakCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as DomainId | undefined;

  async function copy() {
    await navigator.clipboard.writeText(cls.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function removeClass() {
    if (!window.confirm(c.confirmDelete)) return;
    await api(`/api/classes/${encodeURIComponent(cls.id)}`, { method: "DELETE" });
    await onChange();
  }

  async function removeMember(userId: string) {
    if (!window.confirm(c.confirmRemove)) return;
    await api(`/api/classes/${encodeURIComponent(cls.id)}/members/${encodeURIComponent(userId)}`, { method: "DELETE" });
    await onChange();
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-xl font-bold">{cls.name}</h2>
          <p className="mt-1 text-sm text-muted">{c.members(cls.members.length)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 font-mono text-sm font-bold tracking-widest text-accent"
            title={c.copy}
          >
            {cls.code}
            <Icon name={copied ? "check" : "cards"} className="size-4" />
          </button>
          <Button variant="danger" size="sm" onClick={removeClass} aria-label={c.deleteClass}>
            <Icon name="trash" className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-px border-y border-border bg-border sm:grid-cols-3">
        <div className="bg-surface p-4">
          <p className="text-xs text-muted">{c.avgAccuracy}</p>
          <p className="font-display text-2xl font-bold">{avgAccuracy === null ? "—" : `${Math.round(avgAccuracy * 100)}%`}</p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-xs text-muted">{c.totalXp}</p>
          <p className="font-display text-2xl font-bold">{cls.members.reduce((s, m) => s + m.xp, 0)}</p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-xs text-muted">{c.commonWeak}</p>
          <p className="truncate font-semibold">{commonWeak ? t.domains[commonWeak] : "—"}</p>
        </div>
      </div>

      {cls.members.length === 0 ? (
        <p className="p-6 text-sm text-muted">{c.shareCode(cls.code)}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-surface-2/60 text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">{c.student}</th>
                <th className="px-5 py-3 font-semibold">XP</th>
                <th className="px-5 py-3 font-semibold">{t.game.streak}</th>
                <th className="px-5 py-3 font-semibold">{t.results.avgAccuracy}</th>
                <th className="px-5 py-3 font-semibold">{c.weak}</th>
                <th className="px-5 py-3 font-semibold">{c.lastActive}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cls.members.map((m) => (
                <tr key={m.userId}>
                  <td className="px-5 py-3">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted">{m.email}</p>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{m.xp}</td>
                  <td className="px-5 py-3 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="flame" className="size-3.5 text-warning" /> {m.streak}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {m.accuracy === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <Badge tone={m.accuracy >= 0.8 ? "success" : m.accuracy >= 0.5 ? "warning" : "danger"}>
                        {Math.round(m.accuracy * 100)}% · {m.questions}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">{m.weakDomain ? t.domains[m.weakDomain as DomainId] : "—"}</td>
                  <td className={cn("px-5 py-3", !m.lastActive && "text-muted")}>
                    {m.lastActive ? formatDay(m.lastActive, locale) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => removeMember(m.userId)} className="text-muted hover:text-danger" aria-label={c.remove}>
                      <Icon name="x" className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
