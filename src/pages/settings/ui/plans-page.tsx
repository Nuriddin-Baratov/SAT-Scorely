"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { prepareImage } from "@/features/ai-tutor";
import { routes } from "@/shared/config";
import { formatDay, useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card, Container, SectionHeading } from "@/shared/ui/primitives";

interface PayInfo {
  available: boolean;
  price: number;
  user: boolean;
  plan?: "free" | "pro";
  planUntil?: string | null;
  card?: { number: string; holder: string } | null;
  latest?: { status: "pending" | "approved" | "rejected"; createdAt: string } | null;
}

const MAX_FILE = 10 * 1024 * 1024;
const money = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");
const cardGroups = (n: string) => n.replace(/(\d{4})(?=\d)/g, "$1 ");

export function PlansPage() {
  const { t, locale, href } = useI18n();
  const tp = t.plans;
  const [info, setInfo] = useState<PayInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(false);

  const load = useCallback(() => {
    fetch("/api/payments", { cache: "no-store" })
      .then((r) => r.json() as Promise<PayInfo>)
      .then(setInfo)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  // To'lov tekshirilayotganda holatni kuzatib turamiz — admin tasdiqlashi bilan Pro shu yerda yoqiladi
  const pending = info?.latest?.status === "pending";
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(load, 10_000);
    return () => window.clearInterval(id);
  }, [pending, load]);

  const plan = info?.user ? info.plan ?? "free" : null;
  const plans = [
    { id: "free" as const, ...tp.free, icon: "book" as const },
    { id: "pro" as const, ...tp.pro, icon: "crown" as const },
  ];

  const proAction = () => {
    if (!info?.available) return setNote(true);
    setOpen(true);
  };

  return (
    <main className="relative flex-1">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96 opacity-50" aria-hidden />
      <Container className="relative py-5 sm:py-14">
        <SectionHeading eyebrow={tp.eyebrow} title={tp.title} description={tp.description} />

        {info?.user && info.latest && (
          <PaymentBanner status={info.latest.status} plan={plan} />
        )}

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
                    info && !info.user ? (
                      <ButtonLink href={href(routes.login)} className="h-12 w-full bg-white! text-[#1d4ed8]! shadow-none! hover:brightness-95">
                        {tp.buy.login}
                        <Icon name="arrowRight" className="size-4" />
                      </ButtonLink>
                    ) : (
                      <Button className="h-12 w-full bg-white! text-[#1d4ed8]! shadow-none! hover:brightness-95" onClick={proAction} disabled={!info || pending}>
                        <Icon name="crown" className="size-4" />
                        {!info?.available ? tp.soon : pending ? tp.buy.pending : current ? tp.buy.extend : tp.buy.button}
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
                  {pro && note && <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm text-white">{tp.soonNote}</p>}
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

      {info?.card && (
        <BuyDialog
          open={open}
          card={info.card}
          price={info.price}
          onClose={() => setOpen(false)}
          onSent={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </main>
  );
}

function PaymentBanner({ status, plan }: { status: "pending" | "approved" | "rejected"; plan: "free" | "pro" | null }) {
  const { t } = useI18n();
  const tb = t.plans.buy;
  // Tasdiqlangan to'lov — faqat Pro hali faol bo'lsa ko'rsatiladi
  if (status === "approved" && plan !== "pro") return null;
  const tone = status === "pending" ? "bg-accent-soft text-accent" : status === "approved" ? "bg-success-soft text-success" : "bg-warning-soft text-warning";
  return (
    <div className={cn("mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 sm:mt-8", tone)} role="status">
      <Icon name={status === "pending" ? "clock" : status === "approved" ? "check" : "flag"} className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">{status === "pending" ? tb.pending : status === "approved" ? tb.approved : tb.rejected}</p>
        {status === "pending" && <p className="mt-0.5 text-sm opacity-80">{tb.pendingHint}</p>}
      </div>
    </div>
  );
}

function BuyDialog({ open, card, price, onClose, onSent }: { open: boolean; card: { number: string; holder: string }; price: number; onClose: () => void; onSent: () => void }) {
  const { t } = useI18n();
  const tb = t.plans.buy;
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [receipt, setReceipt] = useState<{ data: string; thumb: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // nusxalab bo'lmadi — raqam ekranda ko'rinib turibdi
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_FILE) return setError(tb.tooBig);
    try {
      const { image, thumb } = await prepareImage(file);
      setReceipt({ data: image.data, thumb });
      setError(null);
    } catch {
      setError(tb.error);
    }
  };

  const send = async () => {
    if (!receipt || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: receipt.data }) });
      if (res.ok || res.status === 409) {
        setReceipt(null);
        onSent();
      } else setError(tb.error);
    } catch {
      setError(tb.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="buy-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="confirm-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,30rem)] overflow-y-auto rounded-3xl border border-border bg-surface p-0 text-fg shadow-lift"
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
        <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon name="crown" className="size-5" />
        </span>
        <h2 id="buy-title" className="font-display text-xl font-bold">
          {tb.title}
        </h2>
        <button type="button" onClick={onClose} aria-label={tb.close} className="ml-auto grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg">
          <Icon name="x" className="size-5" />
        </button>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* 1. Karta */}
        <section>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">1</span>
            {tb.step1}
          </p>
          <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] p-5 text-white shadow-lift">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-lg font-semibold tracking-wide whitespace-nowrap tabular-nums sm:text-xl" data-testid="card-number">
                {cardGroups(card.number)}
              </p>
              <button type="button" onClick={copy} className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/25">
                {copied ? tb.copied : tb.copy}
              </button>
            </div>
            {card.holder && (
              <p className="mt-3 text-sm text-white/80">
                {tb.holder}: <span className="font-semibold text-white">{card.holder}</span>
              </p>
            )}
            <p className="mt-1 text-sm text-white/80">
              {tb.amount}: <span className="font-display text-lg font-bold text-white">{money(price)} so&apos;m</span>
            </p>
          </div>
        </section>

        {/* 2. Chek */}
        <section>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">2</span>
            {tb.step2}
          </p>
          <p className="mt-1 text-sm text-muted">{tb.step2Hint}</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => (void pick(e.target.files?.[0]), (e.target.value = ""))} />
          {receipt ? (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receipt.thumb} alt="" className="h-24 rounded-xl border border-border object-cover" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Icon name="image" className="size-4" />
                {tb.change}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted transition hover:border-accent/50 hover:text-accent"
            >
              <Icon name="image" className="size-6" />
              {tb.choose}
            </button>
          )}
        </section>

        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <Button className="h-12 w-full" onClick={send} disabled={!receipt || busy}>
          <Icon name="send" className="size-4" />
          {busy ? tb.sending : tb.send}
        </Button>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Icon name="shield" className="mt-px size-4 shrink-0" />
          {tb.safe}
        </p>
      </div>
    </dialog>
  );
}
