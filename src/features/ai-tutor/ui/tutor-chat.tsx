"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useStudentProfile } from "@/entities/student";
import { useSession } from "@/entities/user";
import { routes } from "@/shared/config";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Card } from "@/shared/ui/primitives";

import { DRAFT_KEY, loadChat, newId, prepareImage, profileContext, saveChat, sendChat, type TutorMessage, type TutorStatus } from "../model/chat";
import { RichText } from "./rich-text";

const MAX_FILE = 10 * 1024 * 1024;
const LEVELS = [1, 2, 3, 4, 5];
const COUNTS = [3, 5, 8, 10];

const noop = () => () => {};

/** Suhbat shu qurilmadan o'qiladi — server HTML'i bilan to'qnashmasligi uchun faqat brauzerda chiziladi */
export function TutorChat() {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) return <div className="h-[calc(100dvh-13rem)] min-h-[28rem] animate-pulse rounded-3xl bg-surface-2 sm:h-[calc(100dvh-16rem)]" aria-busy />;
  return <Chat />;
}

function readDraft() {
  try {
    return window.sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

function Chat() {
  const { t, locale, href } = useI18n();
  const tt = t.tutor;
  const session = useSession();
  const profile = useStudentProfile();
  const [messages, setMessages] = useState<TutorMessage[]>(loadChat);
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [input, setInput] = useState(readDraft);
  const [attached, setAttached] = useState<{ image: { type: string; data: string }; thumb: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [level, setLevel] = useState(3);
  const [count, setCount] = useState(5);
  const [section, setSection] = useState<"math" | "rw">("math");
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshStatus = useCallback(() => {
    fetch("/api/tutor", { cache: "no-store" })
      .then((r) => r.json() as Promise<TutorStatus>)
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, user: false }));
  }, []);

  // Boshqa sahifadan kelgan savol bir marta ishlatiladi
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // sessionStorage yopiq
    }
    refreshStatus();
    return () => abortRef.current?.abort();
  }, [refreshStatus]);

  useEffect(() => {
    if (!busy) saveChat(messages);
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [messages, busy]);

  const attach = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_FILE) return setNotice(tt.imageTooBig);
    try {
      setAttached(await prepareImage(file));
      setNotice(null);
    } catch {
      setNotice(tt.error);
    }
  };

  const send = async (text: string) => {
    const body = text.trim();
    if (busy || (!body && !attached)) return;
    const user: TutorMessage = { id: newId(), role: "user", text: body, thumb: attached?.thumb, image: attached?.image };
    const reply: TutorMessage = { id: newId(), role: "assistant", text: "", status: "streaming" };
    const history = [...messages, user];
    setMessages([...history, reply]);
    setInput("");
    setAttached(null);
    setNotice(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const update = (patch: Partial<TutorMessage>) => setMessages((list) => list.map((m) => (m.id === reply.id ? { ...m, ...patch } : m)));
    try {
      const result = await sendChat(history, {
        locale,
        context: profileContext(profile),
        signal: controller.signal,
        onText: (value, s) => update({ text: value, status: s ?? "streaming" }),
      });
      if (result === "ok") setMessages((list) => list.map((m) => (m.id === reply.id ? { ...m, status: m.status === "refused" ? "refused" : undefined } : m)));
      else {
        // Javob kelmadi — bo'sh javob o'chadi (savol qoladi), chala javob xato belgisi bilan qoladi
        setMessages((list) => list.filter((m) => m.id !== reply.id || m.text).map((m) => (m.id === reply.id ? { ...m, status: "error" } : m)));
        setNotice(result === "login" ? tt.loginRequired : result === "limit" ? tt.limitReached : result === "off" ? tt.offText : tt.error);
      }
    } catch {
      if (!controller.signal.aborted) {
        setMessages((list) => list.filter((m) => m.id !== reply.id || m.text));
        setNotice(tt.error);
      }
    } finally {
      // To'liq rasm yuborilgandan keyin xotirada saqlanmaydi
      setMessages((list) => list.map((m) => (m.id === user.id ? { ...m, image: undefined } : m)));
      setBusy(false);
      abortRef.current = null;
      refreshStatus();
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setNotice(null);
  };

  const off = status && !status.enabled;
  const guest = session.status === "guest";
  const left = status?.limit !== undefined ? status.limit - (status.used ?? 0) : null;
  const disabled = busy || !!off || guest || left === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      <Card className="flex h-[calc(100dvh-13rem)] min-h-[28rem] flex-col overflow-hidden sm:h-[calc(100dvh-16rem)] lg:min-h-[34rem]">
        {/* Sarlavha */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#60a5fa] to-[#2563eb] text-white">
            <Icon name="sparkles" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{tt.title}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("size-2 rounded-full", off ? "bg-muted" : "bg-success")} />
              {off ? tt.offTitle : tt.online}
            </p>
          </div>
          {left !== null && status?.limit !== undefined && (
            <span className="ml-auto hidden rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted tabular-nums sm:inline">
              {tt.limit(status.used ?? 0, status.limit)}
            </span>
          )}
          <Button variant="ghost" size="sm" className={cn(left === null && "ml-auto", "px-2.5!")} onClick={clear} disabled={!messages.length} aria-label={tt.clear} title={tt.clear}>
            <Icon name="refresh" className="size-4" />
            <span className="hidden sm:inline">{tt.clear}</span>
          </Button>
        </div>

        {/* Xabarlar */}
        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5" aria-live="polite">
          <Bubble role="assistant">
            <p>{tt.greeting}</p>
          </Bubble>
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} label={m.role === "user" ? tt.you : undefined}>
              {m.thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumb} alt="" className="mb-2 max-h-56 rounded-xl border border-white/20 object-contain" />
              )}
              {m.role === "user" ? (
                m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>
              ) : m.status === "refused" ? (
                <p className="text-warning">{tt.refused}</p>
              ) : m.text ? (
                <RichText text={m.text} />
              ) : (
                <p className="flex items-center gap-2 text-muted">
                  <span className="flex gap-1" aria-hidden>
                    <span className="size-1.5 animate-bounce rounded-full bg-current" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                  </span>
                  {tt.thinking}
                </p>
              )}
              {m.status === "error" && m.text && <p className="mt-2 text-xs text-danger">{tt.error}</p>}
            </Bubble>
          ))}
        </div>

        {/* Tavsiyalar */}
        {!busy && (
          <div className="flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:px-5">
            {tt.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => (attached || !messages.length ? void send(s) : (setInput(s), inputRef.current?.focus()))}
                className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {notice && (
          <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning sm:mx-5">
            <Icon name="flag" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{notice}</span>
            {notice === tt.loginRequired && (
              <ButtonLink href={href(routes.login)} size="sm" variant="outline">
                {t.auth.login}
              </ButtonLink>
            )}
          </div>
        )}

        {/* Yozish */}
        <form
          className="border-t border-border p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          {attached && (
            <div className="relative mb-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attached.thumb} alt="" className="h-20 rounded-xl border border-border object-cover" />
              <button
                type="button"
                onClick={() => setAttached(null)}
                aria-label={tt.removeImage}
                className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-fg text-bg shadow"
              >
                <Icon name="x" className="size-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => (void attach(e.target.files?.[0]), (e.target.value = ""))} />
            <Button type="button" variant="outline" className="size-11 shrink-0 px-0!" onClick={() => fileRef.current?.click()} disabled={disabled} aria-label={tt.attach} title={tt.attach}>
              <Icon name="image" className="size-5" />
            </Button>
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              maxLength={4000}
              disabled={!!off || guest}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
                if (file) {
                  e.preventDefault();
                  void attach(file);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={guest ? tt.loginRequired : off ? tt.offTitle : tt.placeholder}
              className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface-2/60 px-4 py-2.5 text-[15px] outline-none transition [field-sizing:content] focus:border-accent/50 focus:bg-surface disabled:opacity-60"
            />
            <Button type="submit" className="size-11 shrink-0 px-0!" disabled={disabled || (!input.trim() && !attached)} aria-label={tt.send}>
              <Icon name="send" className="size-5" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">{tt.disclaimer}</p>
        </form>
      </Card>

      {/* Yon panel */}
      <div className="space-y-4">
        {off && (
          <Card className="border-warning/30 bg-warning-soft/40 p-5">
            <p className="flex items-center gap-2 font-semibold text-warning">
              <Icon name="lock" className="size-4" />
              {tt.offTitle}
            </p>
            <p className="mt-1.5 text-sm text-muted">{tt.offText}</p>
          </Card>
        )}
        <Card className="p-5">
          <p className="font-display text-lg font-bold">{tt.panel.title}</p>
          <p className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">{tt.panel.section}</p>
          <Segmented value={section} onChange={setSection} options={[{ value: "math", label: tt.sections.math }, { value: "rw", label: tt.sections.rw }]} />
          <p className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">{tt.panel.level}</p>
          <Segmented value={level} onChange={setLevel} options={LEVELS.map((n) => ({ value: n, label: String(n) }))} />
          <p className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">{tt.panel.count}</p>
          <Segmented value={count} onChange={setCount} options={COUNTS.map((n) => ({ value: n, label: String(n) }))} />
          <Button className="mt-5 w-full" disabled={disabled} onClick={() => void send(tt.makePrompt(count, level, tt.sections[section]))}>
            <Icon name="sparkles" className="size-4" />
            {tt.panel.make}
          </Button>
        </Card>
        <Card className="p-5">
          <p className="font-display text-lg font-bold">{tt.features.title}</p>
          <ul className="mt-3 space-y-2.5">
            {tt.features.items.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon name="check" className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Bubble({ role, label, children }: { role: "user" | "assistant"; label?: string; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
      {!mine && (
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent" aria-hidden>
          <Icon name="sparkles" className="size-4" />
        </span>
      )}
      <div
        aria-label={label}
        className={cn(
          "max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-[15px]",
          mine ? "rounded-tr-md bg-accent text-accent-fg" : "rounded-tl-md bg-surface-2/70 text-fg",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="mt-2 flex gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 flex-1 rounded-xl px-2 text-sm font-semibold transition",
            o.value === value ? "bg-surface text-accent shadow-card" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
