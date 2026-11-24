"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import type { OfficialCertificate } from "@/entities/practice-test";
import { ApiError, api } from "@/shared/api";
import { routes } from "@/shared/config";
import { formatDay, useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card, Container } from "@/shared/ui/primitives";

type Result = { code: string } & ({ state: "valid"; cert: Omit<OfficialCertificate, "eventId"> } | { state: "invalid" | "error" });

/** Ochiq sahifa: sertifikat raqami (yoki QR) bo'yicha haqiqiyligini tekshirish. */
export function VerifyPage({ code }: { code: string }) {
  const { t, locale, href } = useI18n();
  const v = t.verify;
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    api<{ certificate: Omit<OfficialCertificate, "eventId"> }>(`/api/certificates/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then((d) => !cancelled && setResult({ code, state: "valid", cert: d.certificate }))
      .catch((e) => !cancelled && setResult({ code, state: e instanceof ApiError && e.code === "not-found" ? "invalid" : "error" }));
    return () => {
      cancelled = true;
    };
  }, [code, retry]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("code") ?? "").trim().toUpperCase();
    if (!value) return;
    router.push(href(routes.verify(value)));
    setRetry((n) => n + 1);
  }

  const shown = result?.code === code ? result : null;
  const cert = shown?.state === "valid" ? shown.cert : null;
  const total = cert?.scores.rw && cert.scores.math ? cert.scores.rw + cert.scores.math : null;

  return (
    <main className="flex-1">
      <Container className="max-w-xl space-y-4 py-6 sm:py-14">
        <header>
          <h1 className="text-2xl font-bold sm:text-4xl">{v.title}</h1>
          <p className="mt-1 text-sm text-muted">{v.text}</p>
        </header>

        <form onSubmit={submit} className="flex gap-2">
          <input
            key={code}
            name="code"
            defaultValue={code}
            placeholder="SP-2026-XXXXX-XXXXX"
            aria-label={t.certificate.number}
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={24}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 font-mono text-sm uppercase outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
          <Button type="submit" className="h-12 shrink-0">{v.check}</Button>
        </form>

        <div aria-live="polite">
          {cert ? (
            <Card className="overflow-hidden">
              <p className="flex items-center gap-2.5 bg-success-soft px-5 py-4 font-bold text-success">
                <span className="grid size-7 place-items-center rounded-full bg-success text-white">
                  <Icon name="check" className="size-4" strokeWidth={3} />
                </span>
                {v.valid}
              </p>
              <dl className="divide-y divide-border px-5">
                {(
                  [
                    [v.name, cert.name],
                    [v.test, t.final.title],
                    [t.certificate.accuracy, `${Math.round((cert.correct / cert.total) * 100)}% (${cert.correct} / ${cert.total})`],
                    [t.certificate.estimate, total ? `${total} · R&W ${cert.scores.rw}, Math ${cert.scores.math}` : "—"],
                    [t.certificate.date, formatDay(cert.issuedAt.slice(0, 10), locale, true)],
                    [t.certificate.number, cert.code],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="shrink-0 text-sm text-muted">{label}</dt>
                    <dd className="min-w-0 text-right text-sm font-semibold break-words tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="border-t border-border bg-surface-2/50 px-5 py-3 text-xs leading-relaxed text-muted">{v.note}</p>
            </Card>
          ) : shown?.state === "invalid" ? (
            <Card className="p-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
                <Icon name="x" className="size-6" strokeWidth={2.5} />
              </span>
              <p className="mt-3 font-bold">{v.invalid}</p>
              <p className="mt-1 text-sm text-muted">{v.invalidText}</p>
            </Card>
          ) : shown?.state === "error" ? (
            <Card className="p-6 text-center">
              <p className="font-semibold">{v.error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setRetry((n) => n + 1)}>{v.retry}</Button>
            </Card>
          ) : null}
        </div>
      </Container>
    </main>
  );
}
