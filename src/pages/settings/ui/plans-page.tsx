"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { routes } from "@/shared/config";
import { formatDay, useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, Container, SectionHeading } from "@/shared/ui/primitives";

type Provider = "payme" | "click";

interface BillingInfo {
  providers: Provider[];
  price: number;
  user: boolean;
  plan?: "free" | "pro";
  planUntil?: string | null;
  order?: { status: "new" | "paid" | "cancelled"; provider: Provider } | null;
}

const PROVIDER = {
  payme: { name: "Payme", className: "bg-[#00CCCC] text-white" },
  click: { name: "Click", className: "bg-[#0073FF] text-white" },
} as const;

/** To'lov tizimidan qaytilganda manzilda `?order=<id>` bo'ladi */
const returnedOrder = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("order"));

export function PlansPage() {
  const { t, locale, href } = useI18n();
  const tp = t.plans;
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [orderId] = useState(returnedOrder);
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/orders${orderId ? `?id=${encodeURIComponent(orderId)}` : ""}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<BillingInfo>)
      .then(setInfo)
      .catch(() => {});
  }, [orderId]);

  useEffect(load, [load]);

  // To'lov tizimidan qaytildi, lekin tasdiq hali kelmagan — bir necha daqiqa kuzatamiz
  const waiting = info?.order?.status === "new";
  useEffect(() => {
    if (!waiting) return;
    let n = 0;
    const id = window.setInterval(() => (++n > 60 ? window.clearInterval(id) : load()), 3000);
    return () => window.clearInterval(id);
  }, [waiting, load]);

  const pay = async (provider: Provider) => {
    setBusy(provider);
    setError(false);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, locale }) });
      const body = (await res.json()) as { url?: string };
      if (!res.ok || !body.url) throw new Error("order");
      window.location.href = body.url;
    } catch {
      setBusy(null);
      setError(true);
    }
  };

  const buy = () => {
    if (!info?.providers.length) return;
    if (info.providers.length === 1) void pay(info.providers[0]);
    else setChoosing(true);
  };

  const plan = info?.user ? info.plan ?? "free" : null;
  const available = !!info?.providers.length;
  const plans = [
    { id: "free" as const, ...tp.free, icon: "book" as const },
    { id: "pro" as const, ...tp.pro, icon: "crown" as const },
  ];
  const proButton = "h-12 w-full bg-white! text-[#1d4ed8]! shadow-none! hover:brightness-95";

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-14">
        <SectionHeading eyebrow={tp.eyebrow} title={tp.title} description={tp.description} />

        {info?.order && <OrderBanner status={info.order.status} />}

        <div className="mt-6 grid gap-4 sm:mt-10 md:grid-cols-2 lg:gap-6">
          {plans.map((p) => {
            const pro = p.id === "pro";
            const current = plan === p.id;
            return (
              <Card
                key={p.id}
                className={cn(
                  "relative flex flex-col overflow-hidden p-6 sm:p-8",
                  pro && "border-transparent bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6] text-white shadow-lift",
                )}
              >
                {pro && <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden />}
                <div className="relative flex items-center gap-3">
                  <span className={cn("grid size-12 place-items-center rounded-2xl", pro ? "bg-white/15 text-white" : "bg-accent-soft text-accent")}>
                    <Icon name={p.icon} className="size-6" />
                  </span>
                  <p className="font-display text-2xl font-bold">{p.name}</p>
                  <div className="ml-auto flex gap-2">
                    {pro && !current && <Badge className="bg-white/15 text-white">{tp.popular}</Badge>}
                    {current && (
                      <Badge tone={pro ? "neutral" : "success"} className={pro ? "bg-white text-[#1d4ed8]" : undefined}>
                        <Icon name="check" className="size-3" />
                        {tp.current}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="relative mt-6">
                  <span className="font-display text-4xl font-bold sm:text-5xl">{p.price}</span>
                  {pro && <span className="ml-1 text-white/70">{tp.perMonth}</span>}
                </p>
                {pro && current && info?.planUntil && <p className="relative mt-1 text-sm text-white/80">{tp.until(formatDay(info.planUntil.slice(0, 10), locale, true))}</p>}
                <ul className="relative mt-6 flex-1 space-y-3">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", pro ? "bg-white/20 text-white" : "bg-success-soft text-success")}>
                        <Icon name="check" className="size-3" />
                      </span>
                      <span className={pro ? "text-white/90" : undefined}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="relative mt-8">
                  {pro ? (
                    info && !info.user && available ? (
                      <ButtonLink href={href(routes.login)} className={proButton}>
                        {tp.buy.login}
                        <Icon name="arrowRight" className="size-4" />
                      </ButtonLink>
                    ) : (
                      <Button className={proButton} onClick={buy} disabled={!available || !!busy}>
                        <Icon name="crown" className="size-4" />
                        {!info ? "…" : !available ? tp.soon : busy ? tp.buy.redirecting : current ? tp.buy.extend : tp.buy.button}
                      </Button>
                    )
                  ) : (
                    !current && (
                      <ButtonLink href={href(plan ? routes.dashboard : routes.login)} variant="outline" className="h-12 w-full">
                        {plan ? t.nav.dashboard : t.auth.login}
                        <Icon name="arrowRight" className="size-4" />
                      </ButtonLink>
                    )
                  )}
                  {pro && info && !available && <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm text-white">{tp.soonNote}</p>}
                  {pro && error && <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm text-white">{tp.buy.error}</p>}
                  {pro && available && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/70">
                      <Icon name="shield" className="size-3.5" />
                      {info?.providers.map((x) => PROVIDER[x].name).join(" · ")} · Uzcard · Humo
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-6">
          {tp.faq.map((f) => (
            <Card key={f.q} className="p-5 sm:p-6">
              <p className="font-semibold">{f.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </Card>
          ))}
        </div>
      </Container>

      {info && info.providers.length > 1 && (
        <ProviderDialog open={choosing} providers={info.providers} busy={busy} onPick={(p) => void pay(p)} onClose={() => setChoosing(false)} />
      )}
    </main>
  );
}

function OrderBanner({ status }: { status: "new" | "paid" | "cancelled" }) {
  const { t } = useI18n();
  const tb = t.plans.buy;
  const tone = status === "new" ? "bg-accent-soft text-accent" : status === "paid" ? "bg-success-soft text-success" : "bg-warning-soft text-warning";
  return (
    <div className={cn("mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 sm:mt-8", tone)} role="status">
      <Icon name={status === "new" ? "clock" : status === "paid" ? "check" : "flag"} className={cn("mt-0.5 size-5 shrink-0", status === "new" && "animate-pulse")} />
      <div>
        <p className="font-semibold">{status === "new" ? tb.waiting : status === "paid" ? tb.paid : tb.cancelled}</p>
        {status === "new" && <p className="mt-0.5 text-sm opacity-80">{tb.waitingHint}</p>}
      </div>
    </div>
  );
}

function ProviderDialog({ open, providers, busy, onPick, onClose }: { open: boolean; providers: Provider[]; busy: Provider | null; onPick: (p: Provider) => void; onClose: () => void }) {
  const { t } = useI18n();
  const tb = t.plans.buy;
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="pay-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="confirm-dialog m-auto w-[min(100%-2rem,26rem)] rounded-3xl border border-border bg-surface p-0 text-fg shadow-lift"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon name="crown" className="size-5" />
          </span>
          <h2 id="pay-title" className="font-display text-xl font-bold">
            {tb.choose}
          </h2>
          <button type="button" onClick={onClose} aria-label={tb.close} className="ml-auto grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg">
            <Icon name="x" className="size-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">{tb.chooseHint}</p>
        <div className="mt-5 grid gap-3">
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!!busy}
              onClick={() => onPick(p)}
              className={cn("flex h-14 items-center justify-center gap-2 rounded-2xl text-lg font-bold shadow-card transition hover:brightness-105 disabled:opacity-60", PROVIDER[p].className)}
            >
              {busy === p ? tb.redirecting : PROVIDER[p].name}
            </button>
          ))}
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs text-muted">
          <Icon name="shield" className="mt-px size-4 shrink-0" />
          {tb.safe}
        </p>
      </div>
    </dialog>
  );
}
