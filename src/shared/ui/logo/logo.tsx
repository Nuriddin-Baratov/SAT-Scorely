"use client";

import Link from "next/link";

import { siteConfig } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";

export function Logo({ tone = "default" }: { tone?: "default" | "light" }) {
  const { t, href } = useI18n();
  return (
    <Link href={href("/")} className="group inline-flex items-center gap-2.5" aria-label={`${siteConfig.name} — ${t.nav.homeAria}`}>
      <span className="relative grid size-8 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1e40af] text-white shadow-[0_6px_16px_-6px_#2563eb]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.45),transparent_55%)]" />
        <svg viewBox="0 0 24 24" className="relative size-4.5" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
          <path d="M4 17l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={cn("font-display text-lg font-bold tracking-tight", tone === "light" && "text-white")}>
        {siteConfig.name}
      </span>
    </Link>
  );
}
