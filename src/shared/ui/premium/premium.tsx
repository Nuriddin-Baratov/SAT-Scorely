"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/shared/lib";

// Deterministik joylashuv — server va client bir xil HTML chizadi.
const DOTS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 2 + (i % 3),
  delay: `${-(i * 0.9) % 8}s`,
  duration: `${8 + (i % 5) * 2}s`,
}));

/** Yengil fon: ikki glow va suzuvchi zarrachalar (faqat transform/opacity). */
export function Particles({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <span className="pro-glow left-[-10%] top-[-20%] bg-[#4f7cff]/30" />
      <span className="pro-glow right-[-15%] bottom-[-25%] bg-[#f5c76b]/20 [animation-delay:-6s]" />
      {DOTS.map((d, i) => (
        <span
          key={i}
          className={cn("pro-dot", i % 3 === 0 ? "bg-[#f5c76b]" : "bg-[#8fb2ff]")}
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, animationDelay: d.delay, animationDuration: d.duration } as CSSProperties}
        />
      ))}
    </div>
  );
}

/** Kirish oqimi sahifalari uchun to'liq ekranli qorong'i qobiq (sidebar ustidan). */
export function PremiumShell({ children }: { children: ReactNode }) {
  return (
    <main className="pro-shell fixed inset-0 z-[55] overflow-y-auto bg-[#0b0f1a] text-white">
      <Particles className="fixed" />
      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">{children}</div>
    </main>
  );
}

export function ProLogo({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <span className={cn("inline-flex font-display font-extrabold tracking-tight", className)} aria-label="SAT Pro">
      {"SAT Pro".split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className={cn("pro-gradient-text", animated && "splash-letter", ch === " " && "w-[0.3em]")}
          style={animated ? { animationDelay: `${0.12 + i * 0.08}s` } : undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

const SPLASH_KEY = "satpro.splash";
/** `<head>` da: shu sessiyada splash ko'rilgan bo'lsa, birinchi chizishdayoq yashiriladi. */
export const splashInitScript = `try{if(sessionStorage.getItem("${SPLASH_KEY}"))document.documentElement.dataset.splash="seen"}catch(e){}`;

/** Saytga kirgandagi premium loading ekran (~2.6 s), sessiyada bir marta. */
export function SplashScreen({ text }: { text: string }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(SPLASH_KEY);
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {}
    const timer = setTimeout(() => setGone(true), seen ? 0 : 3200);
    return () => clearTimeout(timer);
  }, []);
  if (gone) return null;

  // Halqa + "S" belgisi, harflar birma-bir ko'tariladi ("Pro" — ko'k), yuguruvchi chiziq va shior.
  return (
    <div className="splash" role="status" aria-label={text}>
      <div className="sp-c">
        <div className="sp-logo">
          <div className="sp-ring" />
          <div className="sp-ring2" />
          <div className="sp-tile">
            S<span className="sp-dot" />
          </div>
        </div>
        <div className="sp-word" aria-hidden>
          {["S", "A", "T", " ", "P", "r", "o"].map((ch, i) => (
            <span key={i} className={cn(i > 3 && "b", ch === " " && "sp-gap")} style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="sp-bar">
          <i />
        </div>
        <p className="sp-tag">{text}</p>
      </div>
    </div>
  );
}
