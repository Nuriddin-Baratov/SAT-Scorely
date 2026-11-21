"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { authApi } from "@/entities/user";
import { ApiError } from "@/shared/api";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Logo } from "@/shared/ui/logo";

import { accountStore } from "../model/store";
import { journeyTexts } from "../model/texts";

type Mode = "register" | "login";
type Field = "name" | "email" | "password";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const stepIcons: IconName[] = ["user", "trophy", "calendar"];

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {off ? (
        <>
          <path d="M10.7 5.1A10.7 10.7 0 0 1 21.9 11.7a1 1 0 0 1 0 .7 10.7 10.7 0 0 1-1.4 2.5" />
          <path d="M14.1 14.2a3 3 0 0 1-4.2-4.2" />
          <path d="M17.5 17.5A10.7 10.7 0 0 1 2.1 12.3a1 1 0 0 1 0-.7 10.7 10.7 0 0 1 4.4-5.1" />
          <path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <path d="M2.1 12.3a1 1 0 0 1 0-.7 10.7 10.7 0 0 1 19.8 0 1 1 0 0 1 0 .7 10.7 10.7 0 0 1-19.8 0" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

/**
 * To'liq ekranli Register / Kirish: chapda forma, o'ngda qorong'i panel (3 qadam va statistika).
 * `toolbar` — til va mavzu tugmalari (app qatlamidan beriladi).
 */
export function RegisterForm({ toolbar }: { toolbar?: ReactNode }) {
  const { locale, href } = useI18n();
  const r = journeyTexts[locale].register;
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const errors: Record<Field, string | null> = {
    name: mode === "register" && values.name.trim().length < 2 ? r.errors.name : null,
    email: EMAIL_RE.test(values.email.trim()) ? null : r.errors.email,
    password:
      mode === "register" ? (values.password.length < 8 ? r.errors.password : null) : values.password ? null : r.errors.passwordEmpty,
  };
  const errorOf = (f: Field) => (touched[f] ? errors[f] : null);

  function switchMode(next: Mode) {
    setMode(next);
    setTouched({});
    setFormError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setTouched({ name: true, email: true, password: true });
    if (errors.name || errors.email || errors.password) return;

    setPending(true);
    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    try {
      if (mode === "login") {
        // Serverdagi sessiya → JourneyGate lokal akkauntni o'zi belgilaydi
        await authApi.login(email, values.password);
      } else {
        let cloud = false;
        try {
          await authApi.register({ name, email, password: values.password, role: "student" });
          cloud = true;
        } catch (err) {
          const code = err instanceof ApiError ? err.code : "offline";
          if (code === "exists" || code === "rate") throw err;
          // Baza ulanmagan / server yo'q — hisob shu qurilmada davom etadi
        }
        accountStore.set({ name, email, cloud, createdAt: new Date().toISOString() });
      }
      router.replace(href(routes.dashboard));
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "offline";
      setFormError(
        code === "exists" ? r.errors.exists : code === "rate" ? r.errors.rate : code === "invalid" ? r.errors.invalid : r.errors.offline,
      );
      setPending(false);
    }
  }

  const input = (f: Field) =>
    cn(
      "mt-1.5 h-12 w-full rounded-2xl border bg-bg px-4 outline-none transition placeholder:text-muted/60 focus:ring-4",
      errorOf(f) ? "border-danger focus:ring-danger/15" : "border-border focus:border-accent focus:ring-accent/15",
    );

  const field = (f: Field, label: string, control: ReactNode) => (
    <label className="block text-sm font-semibold">
      {label}
      {control}
      {errorOf(f) && (
        <span role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
          <Icon name="x" className="size-3.5" /> {errorOf(f)}
        </span>
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto bg-surface text-fg">
      <div className="grid min-h-full lg:grid-cols-[1fr_1.05fr]">
        {/* ---------- Forma ---------- */}
        <div className="flex flex-col px-5 py-6 sm:px-12 sm:py-8">
          <div className="flex items-center justify-between gap-3">
            <Logo />
            <div className="flex items-center gap-2">{toolbar}</div>
          </div>

          <div key={mode} className="animate-fade-up mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 sm:py-12">
            {mode === "register" && (
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                <Icon name="sparkles" className="size-3.5" /> {r.badge}
              </span>
            )}
            <h1 className="text-[26px] font-bold tracking-tight text-balance sm:text-[30px]">{mode === "login" ? r.loginTitle : r.title}</h1>
            <p className="mt-1.5 text-muted">{mode === "login" ? r.loginText : r.text}</p>

            <form onSubmit={submit} noValidate className="mt-8 space-y-4">
              {mode === "register" &&
                field(
                  "name",
                  r.name,
                  <input
                    className={input("name")}
                    value={values.name}
                    onChange={(e) => setValues({ ...values, name: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder={r.namePh}
                    autoComplete="name"
                    aria-invalid={!!errorOf("name")}
                  />,
                )}
              {field(
                "email",
                r.email,
                <input
                  type="email"
                  inputMode="email"
                  className={input("email")}
                  value={values.email}
                  onChange={(e) => setValues({ ...values, email: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder={r.emailPh}
                  autoComplete="email"
                  aria-invalid={!!errorOf("email")}
                />,
              )}
              {field(
                "password",
                r.password,
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    className={cn(input("password"), "pr-11")}
                    value={values.password}
                    onChange={(e) => setValues({ ...values, password: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder={mode === "register" ? r.passwordPh : "••••••••"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    aria-invalid={!!errorOf("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? r.hidePassword : r.showPassword}
                    aria-pressed={show}
                    className="absolute top-1.5 right-0 grid h-12 w-11 place-items-center text-muted transition hover:text-fg"
                  >
                    <EyeIcon off={show} />
                  </button>
                </div>,
              )}

              {formError && (
                <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4a63ec] to-[#1f3bb3] font-semibold text-white shadow-[0_14px_30px_-12px_#4a63ec] transition hover:brightness-110 disabled:opacity-70"
              >
                {pending ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                ) : (
                  <>
                    {mode === "login" ? r.loginSubmit : r.submit} <Icon name="arrowRight" className="size-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              {mode === "login" ? r.noAccount : r.haveAccount}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="font-semibold text-accent hover:underline"
              >
                {mode === "login" ? r.register : r.login}
              </button>
            </p>
          </div>
        </div>

        {/* ---------- Qorong'i panel ---------- */}
        <div className="relative hidden overflow-hidden bg-[#070b18] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_60%_30%,#1f3bb3_0%,transparent_70%),radial-gradient(50%_40%_at_20%_90%,rgb(14_147_132/0.35),transparent_70%)]" />
          <div className="gem" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative flex h-full flex-col justify-end bg-gradient-to-t from-[#070b18] via-[#070b18]/70 to-transparent p-14 text-white">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#f3d27a] uppercase">{r.stepsTitle}</p>
            <div className="mt-5 space-y-3">
              {r.steps.map(([title, text], i) => (
                <div
                  key={title}
                  className="reg-step flex items-center gap-4 rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/10 backdrop-blur-md"
                  style={{ animationDelay: `${200 + i * 120}ms` }}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
                    <Icon name={stepIcons[i]} className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">
                      {i + 1}. {title}
                    </p>
                    <p className="text-[13px] text-white/65">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {r.stats.map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/[0.07] p-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
