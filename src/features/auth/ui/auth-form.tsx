"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authApi, type Role } from "@/entities/user";
import { ApiError } from "@/shared/api";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card } from "@/shared/ui/primitives";

type Mode = "login" | "register";

export function AuthForm() {
  const { t, href } = useI18n();
  const a = t.auth;
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setPending(true);
    setError(null);
    try {
      if (mode === "login") await authApi.login(email, password);
      else await authApi.register({ name: String(form.get("name") ?? ""), email, password, role });
      router.push(href(mode === "register" && role === "teacher" ? routes.teacher : routes.settings));
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "server";
      setError(a.errors[code as keyof typeof a.errors] ?? a.errors.server);
    } finally {
      setPending(false);
    }
  }

  const input =
    "mt-2 h-12 w-full rounded-2xl border border-border bg-bg px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";

  return (
    <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="flex rounded-full bg-surface-2 p-1" role="tablist">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-semibold transition",
              mode === m ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
            )}
          >
            {m === "login" ? a.login : a.register}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "register" && (
          <>
            <label className="block text-sm font-medium">
              {a.name}
              <input name="name" required minLength={2} autoComplete="name" className={input} />
            </label>
            <fieldset>
              <legend className="text-sm font-medium">{a.role}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["student", "teacher"] as const).map((r) => (
                  <label
                    key={r}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/20",
                      role === r ? "border-accent bg-accent-soft text-accent" : "border-border hover:border-fg/30",
                    )}
                  >
                    <input type="radio" name="role" className="sr-only" checked={role === r} onChange={() => setRole(r)} />
                    <Icon name={r === "student" ? "user" : "chart"} className="size-4" />
                    {a.roles[r]}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="block text-sm font-medium">
          {a.password}
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={input}
          />
          {mode === "register" && <span className="mt-1 block text-xs font-normal text-muted">{a.passwordHint}</span>}
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? a.wait : mode === "login" ? a.login : a.createAccount}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs leading-relaxed text-muted">{a.privacy}</p>
    </Card>
  );
}
