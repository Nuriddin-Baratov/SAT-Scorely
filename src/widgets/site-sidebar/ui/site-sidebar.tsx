"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { currentStreak, levelOf, useGameState } from "@/entities/gamification";
import { dueMistakes, useMistakes } from "@/entities/mistake";
import { useSession } from "@/entities/user";
import { LocaleSwitcher } from "@/features/switch-locale";
import { ThemeToggle } from "@/features/toggle-theme";
import { routes } from "@/shared/config";
import { stripLocale, useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { useToday } from "@/shared/lib/react";
import { ButtonLink } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Logo } from "@/shared/ui/logo";

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

function useNavGroups() {
  const { t } = useI18n();
  const session = useSession();
  const isTeacher = session.status === "user" && session.user.role === "teacher";
  return [
    {
      title: t.nav.groups.learn,
      items: [
        { path: routes.home, label: t.nav.home, icon: "home" },
        { path: routes.satGuide, label: t.nav.sat, icon: "book" },
        { path: routes.vocabulary, label: t.nav.vocabulary, icon: "cards" },
      ],
    },
    {
      title: t.nav.groups.practice,
      items: [
        { path: routes.tests, label: t.nav.tests, icon: "pencil" },
        { path: routes.simulator, label: t.nav.simulator, icon: "monitor" },
        { path: routes.practice, label: t.nav.practice, icon: "database" },
        { path: routes.mistakes, label: t.nav.mistakes, icon: "refresh" },
        { path: routes.results, label: t.nav.results, icon: "chart" },
        { path: routes.calculator, label: t.nav.calculator, icon: "calculator" },
      ],
    },
    {
      title: t.nav.groups.personal,
      items: [
        { path: routes.dashboard, label: t.nav.dashboard, icon: "target" },
        { path: routes.achievements, label: t.nav.achievements, icon: "medal" },
        { path: routes.leaderboard, label: t.nav.leaderboard, icon: "trophy" },
        ...(isTeacher ? [{ path: routes.teacher, label: t.nav.teacher, icon: "chart" as const }] : []),
        { path: routes.onboarding, label: t.nav.plan, icon: "sparkles" },
        { path: routes.settings, label: t.nav.settings, icon: "sun" },
      ],
    },
  ] satisfies { title: string; items: NavItem[] }[];
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t, href } = useI18n();
  const pathname = stripLocale(usePathname());
  const session = useSession();
  const groups = useNavGroups();
  const today = useToday();
  const mistakes = useMistakes();
  const dueCount = today && mistakes ? dueMistakes(mistakes, today).length : 0;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="px-2 pt-1 pb-6">
        <Logo />
      </div>

      <ProgressCard onNavigate={onNavigate} />

      <nav className="-mx-1 flex-1 space-y-6 overflow-y-auto px-1" aria-label={t.nav.mainMenu}>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted/80 uppercase">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={href(item.path)}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      <Icon name={item.icon} className={cn("size-[18px] shrink-0", active ? "text-accent" : "text-muted group-hover:text-fg")} />
                      <span className="truncate">{item.label}</span>
                      {item.path === routes.mistakes && dueCount > 0 ? (
                        <span className="ml-auto rounded-full bg-warning px-1.5 py-px text-[11px] font-bold text-white tabular-nums">{dueCount}</span>
                      ) : (
                        active && <span className="ml-auto size-1.5 rounded-full bg-accent" aria-hidden />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-6 space-y-3 border-t border-border pt-4">
        <LocaleSwitcher block placement="up" onSwitch={onNavigate} />
        <ThemeToggle />
        {session.status === "loading" ? (
          <div className="h-14 animate-pulse rounded-2xl bg-surface-2" />
        ) : session.status === "user" ? (
          <Link
            href={href(routes.settings)}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl bg-surface-2/70 p-2.5 transition hover:bg-surface-2"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#a99dff] to-[#5b4cf5] text-sm font-bold text-white">
              {session.user.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{session.user.name}</span>
              <span className="block text-xs text-muted">{t.auth.roles[session.user.role]}</span>
            </span>
            <Icon name="arrowRight" className="ml-auto size-4 shrink-0 text-muted" />
          </Link>
        ) : session.status === "guest" ? (
          <ButtonLink href={href(routes.login)} onClick={onNavigate} className="w-full">
            {t.auth.login} <Icon name="arrowRight" className="size-4" />
          </ButtonLink>
        ) : (
          <ButtonLink href={href(routes.onboarding)} onClick={onNavigate} className="w-full">
            {t.nav.start} <Icon name="arrowRight" className="size-4" />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/** Daraja, XP va seriya — sidebar tepasida. */
function ProgressCard({ onNavigate }: { onNavigate?: () => void }) {
  const { t, href } = useI18n();
  const game = useGameState();
  const today = useToday();
  if (!game || !today) return <div className="mb-5 h-[76px] animate-pulse rounded-2xl bg-surface-2" />;

  const level = levelOf(game.xp);
  const streak = currentStreak(game.activeDays, today);
  const activeToday = game.activeDays.includes(today);

  return (
    <Link
      href={href(routes.achievements)}
      onClick={onNavigate}
      className="mb-5 block rounded-2xl bg-gradient-to-br from-accent-soft to-surface-2/60 p-3.5 ring-1 ring-accent/10 transition hover:ring-accent/30"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-accent">
          {t.game.level} {level.index + 1} · {t.game.levels[level.index]}
        </span>
        <span
          className={cn("inline-flex items-center gap-1 font-bold tabular-nums", activeToday ? "text-warning" : "text-muted")}
          title={t.game.streak}
        >
          <Icon name="flame" className="size-3.5" /> {streak}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${level.progress * 100}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted tabular-nums">
        {game.xp} XP{level.next !== null && ` / ${level.next}`}
      </p>
    </Link>
  );
}

export function SiteSidebar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // Mobil menyu ochiqligida: Esc bilan yopish va fonni aylantirishni to'xtatish.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 p-3 pr-0 lg:block">
        <div className="h-full rounded-[1.75rem] border border-border bg-surface p-4 shadow-card">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobil yuqori panel */}
      <div className="sticky top-0 z-40 px-3 pt-3 lg:hidden">
        <div className="flex h-14 items-center justify-between rounded-full border border-border/80 bg-surface/80 pr-2 pl-4 shadow-card backdrop-blur-xl">
          <Logo />
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full bg-surface-2"
              aria-expanded={open}
              aria-controls="mobile-sidebar"
              aria-label={t.nav.menu}
              onClick={() => setOpen(true)}
            >
              <Icon name="list" className="size-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobil drawer */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          className={cn("absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <aside
          id="mobile-sidebar"
          aria-label={t.nav.mobileMenu}
          inert={!open}
          className={cn(
            "absolute inset-y-0 left-0 w-[min(20rem,85vw)] p-3 transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="relative h-full rounded-[1.75rem] border border-border bg-surface p-4 shadow-lift">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.nav.close}
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-surface-2"
            >
              <Icon name="x" className="size-4" strokeWidth={2.2} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </aside>
      </div>
    </>
  );
}
