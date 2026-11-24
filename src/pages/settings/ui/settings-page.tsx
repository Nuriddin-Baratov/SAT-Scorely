"use client";

import { useState, type ReactNode } from "react";

import { authApi, useSession } from "@/entities/user";
import { BackupPanel } from "@/features/backup-data";
import { SyncPanel, forgetSyncedUser, syncNow } from "@/features/cloud-sync";
import { JoinClassPanel } from "@/features/join-class";
import { LocaleSwitcher } from "@/features/switch-locale";
import { TelegramPanel } from "@/features/telegram-link";
import { ThemeToggle } from "@/features/toggle-theme";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { useInstallPrompt } from "@/shared/lib/react";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Badge, Card, Container, IconTile, SectionHeading } from "@/shared/ui/primitives";

function Section({ icon, title, description, children }: { icon: IconName; title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <IconTile>
          <Icon name={icon} />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function SettingsPage() {
  const { t, href } = useI18n();
  const s = t.settings;
  const session = useSession();
  const { canInstall, installed, install } = useInstallPrompt();

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative max-w-4xl space-y-4 py-5 sm:space-y-5 sm:py-16">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} description={s.description} />

        <div className="space-y-5 pt-5">
          <Section icon="user" title={s.account.title} description={s.account.description}>
            {session.status === "loading" ? (
              <div className="h-12 animate-pulse rounded-2xl bg-surface-2" />
            ) : session.status === "offline" ? (
              <p className="text-sm text-muted">{s.account.offline}</p>
            ) : session.status === "guest" ? (
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href={href(routes.login)}>
                  {t.auth.login} <Icon name="arrowRight" className="size-4" />
                </ButtonLink>
                <p className="text-sm text-muted">{s.account.guestHint}</p>
              </div>
            ) : (
              <AccountDetails />
            )}
          </Section>

          {session.status === "user" && (
            <>
              <Section icon="refresh" title={s.cloud.title} description={s.cloud.description}>
                <SyncPanel />
              </Section>
              <Section icon="bolt" title={t.telegram.title} description={t.telegram.subtitle}>
                <TelegramPanel status={session.telegram} />
              </Section>
              {session.user.role === "student" ? (
                <Section icon="layers" title={t.classes.studentTitle} description={t.classes.studentText}>
                  <JoinClassPanel />
                </Section>
              ) : (
                <Section icon="chart" title={t.classes.teacherTitle} description={t.classes.teacherText}>
                  <ButtonLink href={href(routes.teacher)} size="sm">
                    {t.nav.teacher} <Icon name="arrowRight" className="size-4" />
                  </ButtonLink>
                </Section>
              )}
            </>
          )}

          <Section icon="globe" title={s.appearance.title}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">{t.nav.language}</p>
                <LocaleSwitcher block />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">{t.theme.label}</p>
                <ThemeToggle />
              </div>
            </div>
          </Section>

          <Section icon="monitor" title={s.app.title} description={s.app.description}>
            {installed ? (
              <Badge tone="success">
                <Icon name="check" className="size-3" /> {s.app.installed}
              </Badge>
            ) : canInstall ? (
              <Button size="sm" onClick={install}>
                <Icon name="monitor" className="size-4" /> {s.app.install}
              </Button>
            ) : (
              <p className="text-sm text-muted">{s.app.manual}</p>
            )}
          </Section>

          <Section icon="database" title={s.backup.title} description={s.backup.description}>
            <BackupPanel />
          </Section>
        </div>
      </Container>
    </main>
  );
}

function AccountDetails() {
  const { t } = useI18n();
  const s = t.settings.account;
  const session = useSession();
  const [busy, setBusy] = useState(false);
  if (session.status !== "user") return null;
  const { user } = session;

  async function logout() {
    setBusy(true);
    try {
      // Oxirgi natijalar bulutda qolsin; tarmoq bo'lmasa ham chiqish to'xtamaydi
      await syncNow(user.id).catch(() => {});
      await authApi.logout();
      forgetSyncedUser();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(s.confirmDelete)) return;
    await authApi.deleteAccount();
    forgetSyncedUser();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#bfdbfe] to-[#2563eb] text-lg font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
        <Badge tone={user.role === "teacher" ? "gold" : "accent"}>{t.auth.roles[user.role]}</Badge>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={user.publicProfile}
          onChange={(e) => authApi.update({ publicProfile: e.target.checked })}
          className="size-4 accent-[var(--accent)]"
        />
        {s.publicProfile}
      </label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={logout} disabled={busy}>
          {s.logout}
        </Button>
        <Button size="sm" variant="danger" onClick={remove}>
          <Icon name="trash" className="size-4" /> {s.deleteAccount}
        </Button>
      </div>
    </div>
  );
}
