"use client";

import { useState, type ReactNode } from "react";

import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { usePlatform } from "@/shared/lib/react";
import { Button, ButtonLink, buttonClass } from "@/shared/ui/button";
import { Icon, type IconName } from "@/shared/ui/icon";
import { Card, Container } from "@/shared/ui/primitives";
import { QrCode } from "@/shared/ui/qr-code";

const APK_URL = "/download/SAT-Pro.apk";
type Tab = "android" | "ios";

/** Ilovani o'rnatish: Android — APK, iPhone — Safari orqali bosh ekranga. Ro'yxatdan o'tmasdan ochiladi. */
export function InstallPage() {
  const { t, href } = useI18n();
  const i = t.install;
  const platform = usePlatform();
  const [picked, setPicked] = useState<Tab | null>(null);
  const tab: Tab = picked ?? (platform === "ios" || platform === "ios-inapp" ? "ios" : "android");

  return (
    <main className="flex-1">
      <Container className="max-w-2xl space-y-4 py-5 sm:py-14">
        <header className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={64} height={64} className="size-16 shrink-0 rounded-2xl shadow-lift" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-4xl">{i.title}</h1>
            <p className="mt-0.5 text-sm text-muted">{i.text}</p>
          </div>
        </header>

        {platform === "app" ? (
          <Card className="flex flex-col items-start gap-4 p-5">
            <p className="flex items-center gap-2 font-semibold text-success">
              <Icon name="check" className="size-5" strokeWidth={2.6} /> {i.already}
            </p>
            <ButtonLink href={href(routes.dashboard)}>{t.nav.dashboard} <Icon name="arrowRight" className="size-4" /></ButtonLink>
          </Card>
        ) : (
          <>
            <div role="tablist" aria-label={i.title} className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
              {(["android", "ios"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setPicked(key)}
                  className={cn("h-11 rounded-xl text-sm font-semibold transition", tab === key ? "bg-surface text-fg shadow-card" : "text-muted")}
                >
                  {key === "android" ? "Android" : "iPhone / iPad"}
                </button>
              ))}
            </div>

            {tab === "android" ? (
              <Card className="p-4 sm:p-6">
                <a href={APK_URL} download="SAT-Pro.apk" className={buttonClass({ size: "lg" }, "w-full")}>
                  <Icon name="download" className="size-5" /> {i.downloadApk}
                </a>
                <p className="mt-2 text-center text-xs text-muted">{i.apkMeta}</p>
                <Steps
                  items={[
                    { icon: "download", text: i.android[0] },
                    { icon: "shield", text: i.android[1] },
                    { icon: "check", text: i.android[2] },
                  ]}
                />
                <p className="mt-4 rounded-xl bg-surface-2/60 p-3 text-xs leading-relaxed text-muted">{i.androidNote}</p>
              </Card>
            ) : (
              <Card className="p-4 sm:p-6">
                {platform === "ios-inapp" && <OpenInSafari />}
                <Steps
                  first
                  items={[
                    { icon: "compass", text: i.ios[0] },
                    { icon: "share", text: i.ios[1] },
                    { icon: "plusSquare", text: i.ios[2] },
                    { icon: "check", text: i.ios[3] },
                  ]}
                />
                <p className="mt-4 rounded-xl bg-surface-2/60 p-3 text-xs leading-relaxed text-muted">{i.iosNote}</p>
              </Card>
            )}

            {platform === "desktop" && (
              <Card className="flex items-center gap-5 p-5">
                <QrCode value={`${window.location.origin}${routes.install}`} label={i.qr} className="size-28 shrink-0 rounded-lg" />
                <p className="text-sm text-muted">{i.qr}</p>
              </Card>
            )}
          </>
        )}
      </Container>
    </main>
  );
}

function Steps({ items, first = false }: { items: { icon: IconName; text: ReactNode }[]; first?: boolean }) {
  return (
    <ol className={cn("space-y-3", !first && "mt-5")}>
      {items.map((item, n) => (
        <li key={n} className="flex items-start gap-3">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon name={item.icon} className="size-5" />
            <span className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{n + 1}</span>
          </span>
          <p className="pt-2 text-sm leading-relaxed">{item.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** Telegram/Instagram ichki brauzeri: avval Safari'da ochish kerak */
function OpenInSafari() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="mb-5 rounded-xl bg-warning-soft p-3.5 text-sm">
      <p className="font-semibold text-warning">{t.install.inApp}</p>
      <Button
        size="sm"
        variant="outline"
        className="mt-2.5 bg-surface"
        onClick={() => {
          navigator.clipboard
            ?.writeText(`${window.location.origin}${routes.install}`)
            .then(() => setCopied(true))
            .catch(() => {});
        }}
      >
        {copied ? t.install.copied : t.install.copy}
      </Button>
    </div>
  );
}
