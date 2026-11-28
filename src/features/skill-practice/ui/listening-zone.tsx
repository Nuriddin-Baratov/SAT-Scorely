"use client";

import { useEffect, useState } from "react";

import { gameRepository } from "@/entities/gamification";
import { compareWords, dictationSentences, listeningLessons, listeningRepository, useListeningProgress, type ListeningLesson } from "@/entities/skill";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { speak, stopSpeaking, usePlatform, useSpeechSupport } from "@/shared/lib/react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge, Card } from "@/shared/ui/primitives";

import { Pills, Tabs, UpdateAppNotice, WordDiff, levelTone } from "./shared";

const SPEEDS = [0.75, 1, 1.25];

/** Ovoz holati: o'qilyaptimi + boshqaruv */
function useVoice() {
  const [playing, setPlaying] = useState(false);
  const supported = useSpeechSupport().speak;
  useEffect(() => () => stopSpeaking(), []);
  const play = (text: string, rate: number) => {
    setPlaying(true);
    speak(text, { rate, onEnd: () => setPlaying(false) });
  };
  const stop = () => {
    stopSpeaking();
    setPlaying(false);
  };
  return { playing, supported, play, stop };
}

function VoiceNotice() {
  const { t } = useI18n();
  const platform = usePlatform();
  // Eski ilova — yangi APK'ni yuklab olish tugmasi bilan
  if (useSpeechSupport().outdatedApp) return <UpdateAppNotice />;
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">
      <Icon name="flag" className="mt-0.5 size-4 shrink-0" />
      {platform === "app" ? t.listening.updateApp : t.listening.noVoice}
    </div>
  );
}

export function ListeningZone() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"lessons" | "dictation">("lessons");
  const [lesson, setLesson] = useState<ListeningLesson | null>(null);
  return (
    <div className="space-y-5">
      <Tabs
        value={tab}
        onChange={(v) => {
          stopSpeaking();
          setTab(v);
          setLesson(null);
        }}
        options={[
          { value: "lessons", label: t.listening.tabs.lessons, icon: <Icon name="headphones" className="size-4" /> },
          { value: "dictation", label: t.listening.tabs.dictation, icon: <Icon name="pencil" className="size-4" /> },
        ]}
      />
      {tab === "dictation" ? <Dictation /> : lesson ? <LessonPlayer key={lesson.id} lesson={lesson} onBack={() => setLesson(null)} /> : <LessonList onOpen={setLesson} />}
    </div>
  );
}

function LessonList({ onOpen }: { onOpen: (l: ListeningLesson) => void }) {
  const { t } = useI18n();
  const progress = useListeningProgress();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {listeningLessons.map((l) => {
        const best = progress?.[l.id];
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onOpen(l)}
            className="group flex flex-col rounded-3xl border border-border bg-surface p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-accent/40"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
                <Icon name="headphones" className="size-5" />
              </span>
              <Badge tone={levelTone[l.level]} className="ml-auto">
                {l.level}
              </Badge>
            </div>
            <p className="mt-4 font-display text-lg font-bold">{l.title}</p>
            <p className="mt-1 text-sm text-muted">
              {t.listening.seconds(l.seconds)} · {l.questions.length} {t.listening.questions.toLowerCase()}
            </p>
            <div className="mt-4 flex items-center justify-between">
              {best !== undefined ? (
                <Badge tone="success">
                  <Icon name="check" className="size-3" />
                  {t.listening.score(best, l.questions.length)}
                </Badge>
              ) : (
                <span />
              )}
              <Icon name="arrowRight" className="size-5 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LessonPlayer({ lesson, onBack }: { lesson: ListeningLesson; onBack: () => void }) {
  const { t } = useI18n();
  const voice = useVoice();
  const [rate, setRate] = useState(1);
  const [plays, setPlays] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.questions.map(() => null));
  const [result, setResult] = useState<{ correct: number; xp: number } | null>(null);
  const [showText, setShowText] = useState(false);

  const play = () => {
    if (voice.playing) return voice.stop();
    voice.play(lesson.script, rate);
    setPlays((n) => n + 1);
  };

  const check = () => {
    voice.stop();
    const correct = lesson.questions.filter((q, i) => answers[i] === q.answer).length;
    const game = gameRepository.track({ type: "listening", correct, total: lesson.questions.length }, { type: "listening", lessonId: lesson.id, answers });
    listeningRepository.record(lesson.id, correct);
    setResult({ correct, xp: game.gained });
  };

  const retry = () => {
    setAnswers(lesson.questions.map(() => null));
    setResult(null);
    setShowText(false);
    setPlays(0);
  };

  const answered = answers.every((a) => a !== null);

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <Icon name="arrowLeft" className="size-4" />
          {t.listening.back}
        </Button>
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] p-6 text-white">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/15 text-white">{lesson.level}</Badge>
              <span className="text-sm text-white/80">{t.listening.seconds(lesson.seconds)}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{lesson.title}</p>
            {/* To'lqin — o'qilayotganda harakatlanadi */}
            <div className="mt-6 flex h-12 items-center gap-1" aria-hidden>
              {Array.from({ length: 28 }, (_, i) => (
                <span
                  key={i}
                  className={cn("w-1.5 flex-1 rounded-full bg-white/70", voice.playing && "animate-pulse")}
                  style={{ height: `${25 + ((i * 37) % 70)}%`, animationDelay: `${(i % 7) * 90}ms` }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={play}
              disabled={!voice.supported}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-[#1d4ed8] shadow-lg transition hover:brightness-95 disabled:opacity-50"
            >
              <Icon name={voice.playing ? "stop" : "play"} className="size-5" />
              {voice.playing ? t.listening.stop : plays ? t.listening.replay : t.listening.play}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">{t.listening.speed}</span>
            <Pills value={rate} onChange={setRate} label={t.listening.speed} options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))} />
            {plays > 0 && <p className="w-full text-xs text-muted">{t.listening.plays(plays)}</p>}
          </div>
        </Card>
        {!voice.supported && <VoiceNotice />}
        {!result && <p className="rounded-2xl bg-accent-soft/60 px-4 py-3 text-sm text-accent">{t.listening.hidden}</p>}
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xl font-bold">{t.listening.questions}</p>
          {result && (
            <div className="flex items-center gap-2">
              <Badge tone={result.correct === lesson.questions.length ? "success" : "accent"}>{t.listening.score(result.correct, lesson.questions.length)}</Badge>
              {result.xp > 0 && <Badge tone="gold">{t.listening.xp(result.xp)}</Badge>}
            </div>
          )}
        </div>
        <ol className="mt-5 space-y-6">
          {lesson.questions.map((q, qi) => (
            <li key={qi}>
              <p className="font-semibold">
                {qi + 1}. {q.prompt}
              </p>
              <div role="radiogroup" className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((option, oi) => {
                  const selected = answers[qi] === oi;
                  const right = !!result && oi === q.answer;
                  const wrong = !!result && selected && oi !== q.answer;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!!result}
                      onClick={() => setAnswers((list) => list.map((a, i) => (i === qi ? oi : a)))}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-left text-[15px] transition disabled:cursor-default",
                        right ? "border-success bg-success-soft" : wrong ? "border-danger bg-danger-soft" : selected ? "border-accent bg-accent-soft" : "border-border enabled:hover:border-accent/50",
                        result && !right && !wrong && "opacity-60",
                      )}
                    >
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold", selected ? "border-accent bg-accent text-accent-fg" : "border-border text-muted")}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          {result ? (
            <>
              <Button onClick={retry} variant="outline">
                <Icon name="refresh" className="size-4" />
                {t.listening.again}
              </Button>
              <Button variant="ghost" onClick={() => setShowText((v) => !v)}>
                <Icon name="book" className="size-4" />
                {t.listening.transcript}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={check} disabled={!answered}>
                <Icon name="check" className="size-4" />
                {t.listening.check}
              </Button>
              {!answered && <span className="text-sm text-muted">{t.listening.answerAll}</span>}
            </>
          )}
        </div>
        {result && showText && <p className="mt-4 rounded-2xl bg-surface-2/70 p-4 leading-relaxed">{lesson.script}</p>}
      </Card>
    </div>
  );
}

function Dictation() {
  const { t } = useI18n();
  const voice = useVoice();
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(0.85);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<ReturnType<typeof compareWords> | null>(null);
  const sentence = dictationSentences[index];

  const next = () => {
    voice.stop();
    setIndex((i) => (i + 1) % dictationSentences.length);
    setText("");
    setChecked(null);
  };

  return (
    <Card className="mx-auto max-w-3xl p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={levelTone[sentence.level]}>{sentence.level}</Badge>
        <span className="text-sm font-medium text-muted tabular-nums">{t.listening.dictation.progress(index + 1, dictationSentences.length)}</span>
      </div>
      <p className="mt-4 text-sm text-muted">{t.listening.dictation.hint}</p>
      {!voice.supported && (
        <div className="mt-4">
          <VoiceNotice />
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => (voice.playing ? voice.stop() : voice.play(sentence.text, rate))} disabled={!voice.supported}>
          <Icon name={voice.playing ? "stop" : "volume"} className="size-5" />
          {voice.playing ? t.listening.stop : t.listening.play}
        </Button>
        <Pills value={rate} onChange={setRate} label={t.listening.speed} options={[0.6, 0.85, 1].map((s) => ({ value: s, label: `${s}×` }))} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!checked}
        rows={3}
        spellCheck={false}
        autoCapitalize="sentences"
        placeholder={t.listening.dictation.placeholder}
        className="mt-5 w-full resize-none rounded-2xl border border-border bg-surface-2/50 p-4 text-lg outline-none transition focus:border-accent/50 focus:bg-surface disabled:opacity-80"
      />
      {checked && (
        <div className="mt-4 space-y-3 rounded-2xl bg-surface-2/60 p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t.listening.dictation.correct}</p>
          <WordDiff words={checked.words} />
          <Badge tone={checked.score >= 90 ? "success" : checked.score >= 60 ? "accent" : "warning"}>{t.listening.dictation.accuracy(checked.score)}</Badge>
        </div>
      )}
      <div className="mt-5 flex gap-3">
        {checked ? (
          <Button onClick={next}>
            {t.listening.dictation.next}
            <Icon name="arrowRight" className="size-4" />
          </Button>
        ) : (
          <Button onClick={() => setChecked(compareWords(sentence.text, text))} disabled={!text.trim()}>
            <Icon name="check" className="size-4" />
            {t.listening.dictation.check}
          </Button>
        )}
      </div>
    </Card>
  );
}
