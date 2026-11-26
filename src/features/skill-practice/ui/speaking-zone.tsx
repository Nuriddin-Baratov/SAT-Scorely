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

function ReadAloud() {
  const { t } = useI18n();
  const caps = useCapabilities();
  const recorder = useRecorder();
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState("");
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof compareWords> | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const item = readAloudTexts[index];

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
    stopRef.current = listen({
      onText: setHeard,
      onEnd: (text) => {
        setActive(false);
        stopRef.current = null;
        if (text) setResult(compareWords(item.text, text));
      },
      onError: (code) => setError(code === "not-allowed" || code === "service-not-allowed" || code === "permission" ? t.speaking.micDenied : null),
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

  const next = () => {
    stopRef.current?.();
    recorder.reset();
    setIndex((i) => (i + 1) % readAloudTexts.length);
    setHeard("");
    setResult(null);
    setError(null);
  };

  return (
    <Card className="mx-auto max-w-4xl p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={levelTone[item.level]}>{item.level}</Badge>
        <span className="text-sm font-medium text-muted tabular-nums">
          {index + 1} / {readAloudTexts.length}
        </span>
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
              <div className={cn("h-full rounded-full", result.score >= 85 ? "bg-success" : result.score >= 60 ? "bg-accent" : "bg-warning")} style={{ width: `${result.score}%` }} />
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

      {recorder.url && (

        <audio controls src={recorder.url} className="mt-5 w-full" />
      )}
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
        <Button variant={result ? "primary" : "ghost"} onClick={next} disabled={active}>
          {t.speaking.next}
          <Icon name="arrowRight" className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

type Phase = "idle" | "prep" | "talk" | "done";

function TopicTalk({ onAskAi }: { onAskAi?: (prompt: string) => void }) {
  const { t } = useI18n();
  const tt = t.speaking.topic;
  const caps = useCapabilities();
  const recorder = useRecorder();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [spoke, setSpoke] = useState(0);
  const stopListen = useRef<(() => void) | null>(null);
  const startedAt = useRef(0);
  const topic = speakingTopics[index];
  const talkSeconds = TALK_SECONDS[topic.level];
  // Ilovada tizim tanuvchisi bir gapdan keyin to'xtaydi — uzun nutq uchun faqat yozib olamiz
  const liveTranscript = caps.listen && !caps.nativeApp;

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

  const reset = (nextTopic = false) => {
    stopListen.current?.();
    recorder.stop();
    recorder.reset();
    setTranscript("");
    setPhase("idle");
    if (nextTopic) setIndex((i) => (i + 1) % speakingTopics.length);
  };

  const words = transcript.split(/\s+/).filter(Boolean).length;
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
                <Button size="lg" variant="outline" onClick={() => reset()}>
                  <Icon name="refresh" className="size-5" />
                  {tt.again}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => reset(true)}>
                  {tt.next}
                  <Icon name="arrowRight" className="size-5" />
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
