"use client";

import Link from "next/link";
import { useEffect } from "react";

import { certificateNumber, useCertificates, type Certificate } from "@/entities/practice-test";
import { routes } from "@/shared/config";
import { formatDay, useI18n } from "@/shared/i18n";
import { launchConfetti } from "@/shared/ui/confetti";
import { Icon } from "@/shared/ui/icon";
import { Container } from "@/shared/ui/primitives";

/** Oltin muhr (SVG) */
function Seal() {
  const rays = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 120 120" className="cert-seal size-24 sm:size-28" aria-hidden>
      <defs>
        <linearGradient id="seal-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a6" />
          <stop offset="0.5" stopColor="#e0a93a" />
          <stop offset="1" stopColor="#a8741b" />
        </linearGradient>
        <path id="seal-arc" d="M60 60 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
      </defs>
      {rays.map((r) => (
        <path key={r} d="M60 4 L66 16 L54 16 Z" fill="url(#seal-gold)" transform={`rotate(${r} 60 60)`} />
      ))}
      <circle cx="60" cy="60" r="46" fill="url(#seal-gold)" />
      <circle cx="60" cy="60" r="40" fill="none" stroke="#fff6d8" strokeWidth="1" strokeDasharray="2 3" />
      <text fontSize="7.5" fontWeight="700" letterSpacing="2.2" fill="#5c3d07">
        <textPath href="#seal-arc" startOffset="2%">SAT PRO · VERIFIED · SAT PRO · VERIFIED ·</textPath>
      </text>
      <circle cx="60" cy="60" r="27" fill="#0b1c5c" />
      <path d="M60 45 l4.4 9 9.9 1.4-7.2 7 1.7 9.8L60 67.6l-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4z" fill="#93c5fd" />
    </svg>
  );
}

function CertificateView({ cert }: { cert: Certificate }) {
  const { t, locale } = useI18n();
  const c = t.certificate;
  const pct = Math.round(cert.accuracy * 100);
  const total = cert.scores.rw && cert.scores.math ? cert.scores.rw + cert.scores.math : null;
  const sections = [
    cert.scores.rw !== undefined && `R&W ${cert.scores.rw}`,
    cert.scores.math !== undefined && `Math ${cert.scores.math}`,
  ].filter(Boolean);

  const stats = [
    [c.accuracy, `${pct}%`, `${cert.correct} / ${cert.total}`],
    [c.estimate, total ? String(total) : sections.join(" · "), total ? sections.join(" · ") : ""],
    [c.date, formatDay(cert.issuedAt.slice(0, 10), locale, true), ""],
  ];

  return (
    <div className="cert-print cert-in relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.25rem] bg-[#fbf7ee] text-[#0b1c3d] shadow-[0_40px_100px_-30px_rgb(11_28_92/0.55)] sm:aspect-[1.414]">
      {/* Fon naqshi va ramkalar */}
      <div className="cert-pattern pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-3 rounded-[0.9rem] border-[3px] border-[#c99a3b] sm:inset-4" aria-hidden />
      <div className="pointer-events-none absolute inset-5 rounded-[0.6rem] border border-[#c99a3b]/60 sm:inset-7" aria-hidden />
      {["top-3 left-3", "top-3 right-3 rotate-90", "bottom-3 right-3 rotate-180", "bottom-3 left-3 -rotate-90"].map((pos) => (
        <svg key={pos} viewBox="0 0 60 60" className={`pointer-events-none absolute size-14 sm:size-20 ${pos}`} aria-hidden>
          <path d="M4 56 V20 Q4 4 20 4 H56" fill="none" stroke="#c99a3b" strokeWidth="3" />
          <path d="M12 56 V24 Q12 12 24 12 H56" fill="none" stroke="#c99a3b" strokeWidth="1" opacity="0.7" />
          <circle cx="20" cy="20" r="4" fill="#c99a3b" />
        </svg>
      ))}
      <div className="cert-shine pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative flex h-full flex-col items-center px-8 py-12 text-center sm:px-16 sm:py-10">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[11px] bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-lg font-extrabold text-white shadow-[0_8px_20px_-8px_#3b82f6]">S</span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            SAT <span className="text-[#3b82f6]">Pro</span>
          </span>
        </div>

        <p className="cert-title mt-5 font-serif text-5xl tracking-[0.18em] sm:text-6xl">{c.title}</p>
        <p className="mt-1 text-xs font-semibold tracking-[0.3em] text-[#8a6a25] uppercase">{c.subtitle}</p>

        <p className="mt-6 text-sm text-[#0b1c3d]/60 sm:mt-5">{c.presentedTo}</p>
        <p className="mt-1 font-serif text-4xl italic sm:text-5xl">{cert.name}</p>
        <span className="mt-2 h-px w-64 bg-gradient-to-r from-transparent via-[#c99a3b] to-transparent sm:w-96" aria-hidden />
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#0b1c3d]/70">{c.body}</p>

        <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3">
          {stats.map(([label, value, sub]) => (
            <div key={label} className="rounded-xl border border-[#c99a3b]/40 bg-white/60 px-3 py-2.5">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[#8a6a25] uppercase">{label}</p>
              <p className="mt-0.5 font-display text-xl font-bold tabular-nums">{value}</p>
              {sub && <p className="text-[11px] text-[#0b1c3d]/55 tabular-nums">{sub}</p>}
            </div>
          ))}
        </div>

        <div className="mt-8 flex w-full max-w-3xl items-end justify-between gap-4 sm:mt-auto">
          <div className="w-36 text-left sm:w-48">
            <p className="font-serif text-2xl italic text-[#1d4ed8]">SAT Pro</p>
            <span className="block h-px bg-[#0b1c3d]/40" />
            <p className="mt-1 text-[10px] font-semibold tracking-wider text-[#0b1c3d]/60 uppercase">{c.signature}</p>
          </div>
          <Seal />
          <div className="w-36 text-right sm:w-48">
            <p className="font-mono text-sm font-semibold tracking-wider">{certificateNumber(cert)}</p>
            <span className="block h-px bg-[#0b1c3d]/40" />
            <p className="mt-1 text-[10px] font-semibold tracking-wider text-[#0b1c3d]/60 uppercase">{c.number}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificatePage({ id }: { id: string }) {
  const { t, href } = useI18n();
  const c = t.certificate;
  const certs = useCertificates();
  const cert = certs?.find((x) => x.id === id);

  // Sertifikat ochilganda bir marta tabrik konfettisi
  useEffect(() => {
    if (cert) launchConfetti({ particles: 120 });
  }, [cert?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-12">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link prefetch href={href(routes.tests)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
            <Icon name="arrowLeft" className="size-4" /> {c.back}
          </Link>
          {cert && (
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#f9e3a3] via-[#f5b83d] to-[#e0b04a] px-6 text-sm font-bold text-[#2b1d03] shadow-[0_10px_30px_-10px_#f5b83d] transition hover:brightness-105"
              >
                <Icon name="medal" className="size-4" /> {c.print}
              </button>
              <p className="text-xs text-muted">{c.printHint}</p>
            </div>
          )}
        </div>

        {certs === undefined ? (
          <div className="mx-auto aspect-[1.414] max-w-5xl animate-pulse rounded-[1.25rem] bg-surface-2" />
        ) : cert ? (
          <CertificateView cert={cert} />
        ) : (
          <div className="mx-auto max-w-md rounded-[2rem] border border-border bg-surface p-10 text-center shadow-card">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-gold-soft text-gold">
              <Icon name="medal" className="size-8" />
            </span>
            <h1 className="mt-5 text-2xl font-bold">{c.notFound}</h1>
            <p className="mt-2 text-muted">{c.notFoundText}</p>
            <Link prefetch
              href={href(routes.tests)}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg"
            >
              {c.back} <Icon name="arrowRight" className="size-4" />
            </Link>
          </div>
        )}
      </Container>
    </main>
  );
}
