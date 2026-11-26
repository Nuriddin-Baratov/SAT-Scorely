"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { ApiError, api } from "@/shared/api";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { confirmDialog } from "@/shared/ui/confirm";
import { Icon } from "@/shared/ui/icon";

interface JoinedClass {
  id: string;
  name: string;
  teacher: string;
}

/** O'quvchi: o'qituvchi bergan kod bilan sinfga qo'shilish va a'zo bo'lgan sinflar ro'yxati */
export function JoinClassPanel() {
  const { t } = useI18n();
  const c = t.classes;
  const [classes, setClasses] = useState<JoinedClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ classes: JoinedClass[] }>("/api/classes", { cache: "no-store" });
    setClasses(data.classes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ classes: JoinedClass[] }>("/api/classes", { cache: "no-store" })
      .then((data) => !cancelled && setClasses(data.classes))
      .catch(() => !cancelled && setClasses([]));
    return () => {
      cancelled = true;
    };
  }, []);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = String(new FormData(form).get("code") ?? "");
    setBusy(true);
    setError(null);
    try {
      await api("/api/classes/join", { method: "POST", json: { code } });
      form.reset();
      await load();
    } catch (e) {
      setError(e instanceof ApiError && e.code === "invalid" ? c.badCode : t.auth.errors.server);
    } finally {
      setBusy(false);
    }
  }

  async function leave(id: string) {
    if (!(await confirmDialog({ title: c.confirmLeave, tone: "danger", icon: "x" }))) return;
    await api(`/api/classes/${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={join} className="flex flex-wrap gap-2">
        <input
          name="code"
          required
          minLength={4}
          maxLength={10}
          placeholder={c.codePlaceholder}
          aria-label={c.code}
          className="h-10 w-40 rounded-xl border border-border bg-bg px-3 font-mono tracking-widest uppercase outline-none focus:border-accent"
        />
        <Button type="submit" size="sm" disabled={busy}>
          {c.join}
        </Button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
      {classes && classes.length > 0 && (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {classes.map((cls) => (
            <li key={cls.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-medium">{cls.name}</span>
                <span className="text-muted"> · {cls.teacher}</span>
              </span>
              <button type="button" onClick={() => leave(cls.id)} className="text-muted hover:text-danger" aria-label={c.leave}>
                <Icon name="x" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
