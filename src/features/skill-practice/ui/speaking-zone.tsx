"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { compareWords, readAloudTexts, speakingTopics } from "@/entities/skill";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { listen, speak, stopSpeaking, useSpeechSupport } from "@/shared/lib/react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card } from "@/shared/ui/primitives";

import { useRecorder } from "../model/recorder";
import { Tabs, WordDiff, levelTone } from "./shared";

const PREP_SECONDS = 15;
const TALK_SECONDS = { B1: 45, B2: 60, C1: 60 } as const;

/** Nutqni tanish va ovoz bor-yo'qligi; sahifadan chiqilganda ovoz to'xtaydi */
function useCapabilities() {
  const caps = useSpeechSupport();
  useEffect(() => () => stopSpeaking(), []);
  return caps;
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">
      <Icon name="flag" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function SpeakingZone({ onAskAi }: { onAskAi?: (prompt: string) => void }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"read" | "topic">("read");
  return (
    <div className="space-y-5">
      <Tabs
        value={tab}
        onChange={(v) => {
          stopSpeaking();
          setTab(v);
        }}
        options={[
          { value: "read", label: t.speaking.tabs.read, icon: <Icon name="mic" className="size-4" /> },
          { value: "topic", label: t.speaking.tabs.topic, icon: <Icon name="chat" className="size-4" /> },
        ]}
      />
      {tab === "read" ? <ReadAloud /> : <TopicTalk onAskAi={onAskAi} />}
    </div>
  );
}

function MicButton({ active, onClick, disabled, label }: { active: boolean; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "relative grid size-20 shrink-0 place-items-center rounded-full text-white shadow-lift transition disabled:opacity-50 sm:size-24",
        active ? "bg-danger" : "bg-accent hover:brightness-110",
      )}
    >
      {active && <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" aria-hidden />}
      <Icon name={active ? "stop" : "mic"} className="relative size-8 sm:size-9" />
    </button>
  );
}

/** Bitta sessiyada nechta mashq */
const PER_ROUND = 2;

/** `round`-chi to'plam: ro'yxatdan ketma-ket 2 tadan (B1 → B2 → C1 → qaytadan) */
function roundOf<T>(list: T[], round: number) {
  const start = (round * PER_ROUND) % list.length;
  return Array.from({ length: PER_ROUND }, (_, i) => list[(start + i) % list.length]);
}

const scoreTone = (score: number) => (score >= 85 ? "bg-success" : score >= 60 ? "bg-accent" : "bg-warning");

/** Natija sahifasi: katta foiz/ko'rsatkich, mashqlar ro'yxati va tugmalar */
function Summary({
  headline,
  caption,
  verdict,
  children,
  onRetry,
  onNext,
}: {
  headline: string;
  caption: string;
  verdict: string;
  children: React.ReactNode;
  onRetry: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  return (
    <Card className="mx-auto max-w-4xl overflow-hidden p-0">
      <div className="bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] px-6 py-8 text-center text-white sm:py-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-white/70 uppercase">{t.speaking.summary.title}</p>
        <p className="mt-3 font-display text-6xl font-bold tabular-nums sm:text-7xl">{headline}</p>
        <p className="mt-1 text-sm text-white/80">{caption}</p>
        <p className="mx-auto mt-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">{verdict}</p>
      </div>
      <div className="space-y-3 p-5 sm:p-8">{children}</div>
      <div className="flex flex-wrap gap-3 border-t border-border p-5 sm:px-8">
        <Button variant="outline" onClick={onRetry}>
          <Icon name="refresh" className="size-4" />
          {t.speaking.summary.retry}
        </Button>
        <Button onClick={onNext}>
          {t.speaking.summary.newSet}
          <Icon name="arrowRight" className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

function ReadAloud() {
  const { t } = useI18n();
  const ts = t.speaking.summary;
  const caps = useCapabilities();
  const recorder = useRecorder();
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  /** Har bir matn natijasi: foiz (`null` — tanilmadi/o'tkazildi) */
  const [scores, setScores] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [heard, setHeard] = useState("");
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof compareWords> | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const items = roundOf(readAloudTexts, round);
  const item = items[index];
  const last = index === items.length - 1;
  const speechError = (code: string) =>
    ["not-allowed", "service-not-allowed", "permission", "audio-capture"].includes(code)
      ? t.speaking.micDenied
      : code === "network"
        ? t.speaking.network
        : code === "no-speech"
          ? t.speaking.noSpeech
          : code === "unsupported" || code === "language-not-supported"
            ? t.speaking.noRecognition
            : t.speaking.failed;

  useEffect(() => () => stopRef.current?.(), []);

  const start = () => {
    stopSpeaking();
    setResult(null);
    setHeard("");
    setError(null);
    if (!caps.listen) {
      // Nutq tanilmaydi — faqat yozib olamiz
      void recorder.start().then((ok) => setActive(ok));
      return;
    }
    setActive(true);
    // Foydalanuvchi "To'xtatish"ni bosguncha tinglaydi; matn to'liq o'qilsa — o'zi tugaydi
    let done = false;
    const target = item.text;
    const at = index;
    stopRef.current = listen({
      maxMs: 90_000,
      onText: (text) => {
        setHeard(text);
        if (!done && compareWords(target, text).score === 100) {
          done = true;
          window.setTimeout(() => stopRef.current?.(), 400);
        }
      },
      onEnd: (text) => {
        setActive(false);
        stopRef.current = null;
        if (!text) return;
        const r = compareWords(target, text);
        setResult(r);
        setScores((list) => {
          const next = [...list];
          next[at] = r.score;
          return next;
        });
      },
      onError: (code) => setError(speechError(code)),
    });
  };

  const stop = () => {
    if (!caps.listen) {
      recorder.stop();
      setActive(false);
      return;
    }
    stopRef.current?.();
  };

  const clearItem = () => {
    stopRef.current?.();
    recorder.reset();
    setHeard("");
    setResult(null);
    setError(null);
  };

  const next = () => {
    clearItem();
    if (last) setFinished(true);
    else setIndex((i) => i + 1);
  };

  const restart = (nextRound: boolean) => {
    clearItem();
    if (nextRound) setRound((r) => r + 1);
    setIndex(0);
    setScores([]);
    setFinished(false);
  };

  if (finished) {
    const valid = items.map((_, i) => scores[i] ?? null);
    const counted = valid.filter((s): s is number => s !== null);
    const avg = counted.length ? Math.round(counted.reduce((a, b) => a + b, 0) / counted.length) : null;
    return (
      <Summary
        headline={avg === null ? "—" : `${avg}%`}
        caption={ts.average}
        verdict={avg === null ? ts.noScore : avg >= 85 ? ts.great : avg >= 60 ? ts.good : ts.practice}
        onRetry={() => restart(false)}
        onNext={() => restart(true)}
      >
        {items.map((it, i) => (
          <div key={it.id} className="rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2">
              <Badge tone={levelTone[it.level]}>{it.level}</Badge>
              <span className="ml-auto font-display text-lg font-bold tabular-nums">{valid[i] === null ? ts.skipped : `${valid[i]}%`}</span>
            </div>
            <p className="mt-2 leading-relaxed">{it.text}</p>
            {valid[i] !== null && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className={cn("h-full rounded-full", scoreTone(valid[i]!))} style={{ width: `${valid[i]}%` }} />
              </div>
            )}
          </div>
        ))}
      </Summary>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={levelTone[item.level]}>{item.level}</Badge>
        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-8 rounded-full", i < index || (i === index && result) ? "bg-accent" : i === index ? "bg-accent/40" : "bg-surface-2")} />
          ))}
          <span className="ml-1 text-sm font-medium text-muted tabular-nums">
            {index + 1} / {items.length}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{t.speaking.readHint}</p>
      <div className="mt-5 rounded-3xl bg-surface-2/60 p-5 sm:p-7">
        {result ? <WordDiff words={result.words} /> : <p className="text-lg leading-relaxed font-medium sm:text-xl">{item.text}</p>}
      </div>

      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <MicButton active={active} onClick={active ? stop : start} label={active ? t.speaking.stop : t.speaking.speak} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="font-semibold">{active ? t.speaking.listening : result ? t.speaking.accuracy(result.score) : t.speaking.speak}</p>
          {heard && <p className="mt-1 text-sm text-muted italic">“{heard}”</p>}
          {result && (
            <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-2 max-sm:mx-auto">
              <div className={cn("h-full rounded-full", scoreTone(result.score))} style={{ width: `${result.score}%` }} />
            </div>
          )}
        </div>
        {caps.speak && (
          <Button variant="outline" onClick={() => speak(item.text, { rate: 0.9 })}>
            <Icon name="volume" className="size-4" />
            {t.speaking.listenModel}
          </Button>
        )}
      </div>

      {recorder.url && <audio controls src={recorder.url} className="mt-5 w-full" />}
      <div className="mt-5 space-y-3">
        {!caps.listen && <Notice>{t.speaking.noRecognition}</Notice>}
        {(error || recorder.state === "denied") && <Notice>{error ?? t.speaking.micDenied}</Notice>}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
        {(result || recorder.url) && (
          <Button variant="outline" onClick={start} disabled={active}>
            <Icon name="refresh" className="size-4" />
            {t.speaking.tryAgain}
          </Button>
        )}
        <Button variant={result || recorder.url ? "primary" : "ghost"} onClick={next} disabled={active}>
          {last ? ts.show : t.speaking.next}
          <Icon name={last ? "chart" : "arrowRight"} className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

type Phase = "idle" | "prep" | "talk" | "done";

interface TalkResult {
  seconds: number;
  words: number;
  url: string | null;
}

function TopicTalk({ onAskAi }: { onAskAi?: (prompt: string) => void }) {
  const { t } = useI18n();
  const tt = t.speaking.topic;
  const ts = t.speaking.summary;
  const caps = useCapabilities();
  const recorder = useRecorder();
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(TalkResult | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [spoke, setSpoke] = useState(0);
  const stopListen = useRef<(() => void) | null>(null);
  const startedAt = useRef(0);
  const topics = roundOf(speakingTopics, round);
  const topic = topics[index];
  const last = index === topics.length - 1;
  const talkSeconds = TALK_SECONDS[topic.level];
  // Ilovada tizim tanuvchisi bir gapdan keyin to'xtaydi — uzun nutq uchun faqat yozib olamiz
  const liveTranscript = caps.listen && !caps.nativeApp;
  const words = transcript.split(/\s+/).filter(Boolean).length;

  const finish = () => {
    recorder.stop();
    stopListen.current?.();
    stopListen.current = null;
    setSpoke(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
    setPhase("done");
  };

  const beginTalk = async () => {
    setTranscript("");
    if (!(await recorder.start())) {
      setPhase("idle");
      return;
    }
    startedAt.current = Date.now();
    setLeft(talkSeconds);
    setPhase("talk");
    if (liveTranscript)
      stopListen.current = listen({
        maxMs: (talkSeconds + 5) * 1000,
        onText: setTranscript,
        onEnd: (text) => text && setTranscript(text),
      });
  };
  // Vaqt tugadi: tayyorgarlikdan keyin — gapirish, gapirishdan keyin — tugatish
  const timeUp = useEffectEvent(() => (phase === "prep" ? void beginTalk() : finish()));

  // Sanoq: tayyorgarlik → gapirish → tugash
  useEffect(() => {
    if (phase !== "prep" && phase !== "talk") return;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        window.clearInterval(id);
        // Holat yangilanishidan tashqarida chaqiramiz
        window.setTimeout(timeUp, 0);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(
    () => () => {
      stopListen.current?.();
    },
    [],
  );

  const clearTopic = () => {
    stopListen.current?.();
    recorder.stop();
    recorder.reset();
    setTranscript("");
    setPhase("idle");
  };

  /** Shu mavzu natijasini saqlab, keyingisiga (yoki yakuniy natijaga) o'tadi */
  const next = () => {
    const record: TalkResult | null = phase === "done" ? { seconds: spoke, words, url: recorder.url } : null;
    setResults((list) => {
      const copy = [...list];
      copy[index] = record;
      return copy;
    });
    clearTopic();
    if (last) setFinished(true);
    else setIndex((i) => i + 1);
  };

  const restart = (nextRound: boolean) => {
    clearTopic();
    if (nextRound) setRound((r) => r + 1);
    setIndex(0);
    setResults([]);
    setFinished(false);
  };

  if (finished) {
    const done = topics.map((_, i) => results[i] ?? null);
    const total = done.reduce((sum, r) => sum + (r?.seconds ?? 0), 0);
    const goal = topics.reduce((sum, tp) => sum + TALK_SECONDS[tp.level], 0);
    const fill = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0;
    return (
      <Summary
        headline={`${total}s`}
        caption={ts.spokeOf(total, goal)}
        verdict={fill >= 85 ? ts.great : fill >= 50 ? ts.good : ts.practice}
        onRetry={() => restart(false)}
        onNext={() => restart(true)}
      >
        {topics.map((tp, i) => {
          const r = done[i];
          return (
            <div key={tp.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2">
                <Badge tone={levelTone[tp.level]}>{tp.level}</Badge>
                <span className="ml-auto font-display text-lg font-bold tabular-nums">{r ? `${r.seconds}s / ${TALK_SECONDS[tp.level]}s` : ts.skipped}</span>
              </div>
              <p className="mt-2 font-semibold">{tp.prompt}</p>
              {r && (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className={cn("h-full rounded-full", scoreTone(Math.round((r.seconds / TALK_SECONDS[tp.level]) * 100)))} style={{ width: `${Math.min(100, (r.seconds / TALK_SECONDS[tp.level]) * 100)}%` }} />
                  </div>
                  {r.words > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="accent">{tt.words(r.words)}</Badge>
                      <Badge tone="neutral">{tt.wpm(Math.round((r.words / r.seconds) * 60))}</Badge>
                    </div>
                  )}
                  {r.url && <audio controls src={r.url} className="mt-3 w-full" />}
                </>
              )}
            </div>
          );
        })}
      </Summary>
    );
  }

  const total = phase === "prep" ? PREP_SECONDS : talkSeconds;
  const pct = phase === "prep" || phase === "talk" ? (left / total) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      <Card className="p-5 sm:p-8">
        <div className="flex items-center gap-2">
          <Badge tone={levelTone[topic.level]}>{topic.level}</Badge>
          <span className="text-sm text-muted">
            {PREP_SECONDS}s + {talkSeconds}s
          </span>
          <span className="ml-auto text-sm font-medium text-muted tabular-nums">
            {index + 1} / {topics.length}
          </span>
        </div>
        <p className="mt-4 font-display text-2xl leading-snug font-bold sm:text-3xl">{topic.prompt}</p>

        <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row">
          {/* Taymer halqasi */}
          <div className="relative grid size-32 shrink-0 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" className="stroke-surface-2" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={276.5}
                strokeDashoffset={276.5 - (276.5 * pct) / 100}
                className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", phase === "talk" ? "stroke-danger" : "stroke-accent")}
              />
            </svg>
            <div className="text-center">
              <p className="font-display text-3xl font-bold tabular-nums" role="timer">
                {phase === "prep" || phase === "talk" ? left : phase === "done" ? spoke : talkSeconds}
              </p>
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{phase === "prep" ? tt.prep : phase === "talk" ? tt.talk : "sec"}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap justify-center gap-3 sm:justify-start">
            {phase === "idle" && (
              <>
                <Button
                  size="lg"
                  onClick={() => {
                    setLeft(PREP_SECONDS);
                    setPhase("prep");
                  }}
                >
                  <Icon name="play" className="size-5" />
                  {tt.start}
                </Button>
                <Button size="lg" variant="outline" onClick={() => void beginTalk()}>
                  <Icon name="mic" className="size-5" />
                  {tt.skipPrep}
                </Button>
              </>
            )}
            {phase === "prep" && (
              <Button size="lg" onClick={() => void beginTalk()}>
                <Icon name="mic" className="size-5" />
                {tt.skipPrep}
              </Button>
            )}
            {phase === "talk" && (
              <Button size="lg" className="bg-danger shadow-[0_8px_24px_-8px_var(--danger)]" onClick={finish}>
                <Icon name="stop" className="size-5" />
                {tt.finish}
              </Button>
            )}
            {phase === "done" && (
              <>
                <Button size="lg" onClick={next}>
                  {last ? ts.show : tt.next}
                  <Icon name={last ? "chart" : "arrowRight"} className="size-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    clearTopic();
                  }}
                >
                  <Icon name="refresh" className="size-5" />
                  {tt.again}
                </Button>
              </>
            )}
          </div>
        </div>

        {phase === "talk" && (
          <p className="mt-6 flex items-center gap-2 text-sm font-medium text-danger">
            <span className="size-2.5 animate-pulse rounded-full bg-danger" /> REC
          </p>
        )}
        {liveTranscript && transcript && (phase === "talk" || phase === "done") && (
          <p className="mt-4 rounded-2xl bg-surface-2/60 p-4 leading-relaxed text-muted italic">“{transcript}”</p>
        )}
        {phase === "done" && (
          <div className="mt-5 space-y-4">
            {recorder.url && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{tt.recording}</p>
                <audio controls src={recorder.url} className="w-full" />
              </div>
            )}
            {words > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge tone="accent">{tt.words(words)}</Badge>
                <Badge tone="neutral">{tt.wpm(Math.round((words / spoke) * 60))}</Badge>
              </div>
            )}
            {onAskAi && words >= 5 && (
              <Button variant="outline" onClick={() => onAskAi(tt.aiPrompt(topic.prompt, transcript))}>
                <Icon name="sparkles" className="size-4" />
                {tt.askAi}
              </Button>
            )}
          </div>
        )}
        {phase === "idle" && (
          <Button variant="ghost" className="mt-5" onClick={next}>
            {last ? ts.show : tt.next}
            <Icon name="arrowRight" className="size-4" />
          </Button>
        )}
        <div className="mt-5 space-y-3">
          {recorder.state === "denied" && <Notice>{t.speaking.micDenied}</Notice>}
          {recorder.state === "unsupported" && <Notice>{t.speaking.noRecognition}</Notice>}
        </div>
      </Card>

      <Card className="h-fit p-5">
        <p className="font-display text-lg font-bold">{tt.hints}</p>
        <ol className="mt-3 space-y-2.5">
          {topic.hints.map((h, i) => (
            <li key={h} className="flex gap-3 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
              <span className="pt-0.5">{h}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
