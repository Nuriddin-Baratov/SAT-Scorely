"use client";

import { useSyncExternalStore } from "react";

/**
 * Ovoz: matnni o'qish (TTS) va nutqni tanish. Brauzerda — Web Speech API,
 * Android ilovada (WebView'da bu API yo'q) — ilovaning `SATProApp` ko'prigi orqali tizim ovozi.
 */

interface NativeBridge {
  speak?: (id: string, text: string, rate: number) => void;
  stopSpeak?: () => void;
  listen?: (id: string, lang: string) => void;
  stopListen?: () => void;
}

type Callback = (type: string, payload: string) => void;

declare global {
  interface Window {
    SATProApp?: NativeBridge;
    /** Ilova shu funksiyani chaqiradi: `__satproSpeech(id, "end" | "partial" | "result" | "error", matn)` */
    __satproSpeech?: (id: string, type: string, payload: string) => void;
  }
}

const callbacks = new Map<string, Callback>();
let seq = 0;

function native() {
  if (typeof window === "undefined") return null;
  const bridge = window.SATProApp;
  if (!bridge) return null;
  window.__satproSpeech ??= (id, type, payload) => callbacks.get(id)?.(type, payload);
  return bridge;
}

// ---------------- O'qish (TTS) ----------------

let voice: SpeechSynthesisVoice | null | undefined;
function englishVoice() {
  if (voice !== undefined && voice !== null) return voice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  voice = en.find((v) => /en[-_]us/i.test(v.lang) && /google|natural|samantha|aria|jenny/i.test(v.name)) ?? en.find((v) => /en[-_]us/i.test(v.lang)) ?? en[0] ?? null;
  return voice;
}

/** Shu qurilmada matnni ovoz bilan o'qib bo'ladimi */
export function canSpeak() {
  const bridge = native();
  if (bridge) return typeof bridge.speak === "function";
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let speakToken = 0;

/** Matnni o'qiydi; avvalgisi to'xtatiladi. Tugaganda `onEnd`. */
export function speak(text: string, { rate = 1, onEnd }: { rate?: number; onEnd?: () => void } = {}) {
  stopSpeaking();
  const token = ++speakToken;
  const done = () => {
    if (token === speakToken) onEnd?.();
  };
  const bridge = native();
  if (bridge?.speak) {
    const id = `s${++seq}`;
    callbacks.set(id, (type) => {
      if (type === "end" || type === "error") {
        callbacks.delete(id);
        done();
      }
    });
    bridge.speak(id, text, rate);
    return;
  }
  if (!("speechSynthesis" in window)) return done();
  // Chrome uzun matnni ~15 soniyada uzib qo'yadi — gaplarga bo'lib navbatga qo'yamiz
  const parts = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [text];
  const synth = window.speechSynthesis;
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part.trim());
    u.lang = "en-US";
    u.rate = rate;
    const v = englishVoice();
    if (v) u.voice = v;
    if (i === parts.length - 1) {
      u.onend = done;
      u.onerror = done;
    }
    synth.speak(u);
  });
}

export function stopSpeaking() {
  speakToken++;
  const bridge = native();
  if (bridge?.stopSpeak) bridge.stopSpeak();
  else if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

// ---------------- Nutqni tanish ----------------

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function recognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Shu qurilmada nutqni matnga aylantirib bo'ladimi */
export function canListen() {
  const bridge = native();
  if (bridge) return typeof bridge.listen === "function";
  return !!recognitionCtor();
}

export interface ListenHandlers {
  /** Hozircha eshitilgan butun matn (yakuniy + oraliq) */
  onText: (text: string) => void;
  onEnd: (text: string) => void;
  onError?: (code: string) => void;
}

/** Qayta urinib bo'lmaydigan xatolar — tinglash to'xtaydi va sababi ko'rsatiladi */
const FATAL = new Set(["not-allowed", "service-not-allowed", "permission", "audio-capture", "unsupported", "language-not-supported", "busy"]);

/**
 * Ingliz tilidagi nutqni tinglaydi — foydalanuvchi to'xtatmaguncha (yoki `maxMs` o'tguncha).
 * Brauzer/telefon har jimlikdan keyin tanishni o'zi tugatadi; shunda jimgina qayta boshlaymiz va matnni yig'amiz.
 * Qaytaradi: to'xtatish funksiyasi (yig'ilgan matn `onEnd` ga keladi).
 */
export function listen({ onText, onEnd, onError, maxMs = 120_000 }: ListenHandlers & { maxMs?: number }): () => void {
  let committed = "";
  let stopped = false;
  let ended = false;
  let quick = 0;
  let networkFails = 0;
  let stopSegment: () => void = () => {};
  const join = (segment: string) => `${committed} ${segment}`.replace(/\s+/g, " ").trim();

  const finish = () => {
    if (ended) return;
    ended = true;
    window.clearTimeout(limit);
    onEnd(committed);
  };
  const fail = (code: string) => {
    if (ended) return;
    stopped = true;
    onError?.(code);
    finish();
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    stopSegment();
    // Tanuvchi javob bermay qolsa ham tugatamiz
    window.setTimeout(finish, 1500);
  };
  const limit = window.setTimeout(stop, maxMs);

  /** Bo'lak tugadi: to'xtatilmagan bo'lsa — qayta boshlaymiz */
  const segmentEnded = (startedAt: number, heard: boolean, code?: string) => {
    if (code && FATAL.has(code)) return fail(code);
    if (code === "network" && ++networkFails >= 3) return fail(code);
    if (stopped) return finish();
    // Hech narsa eshitmay ketma-ket tez tugasa — mikrofon ishlamayapti
    if (!heard && Date.now() - startedAt < 1500) {
      if (++quick >= 6) return fail("no-speech");
    } else quick = 0;
    window.setTimeout(() => !stopped && startSegment(), 200);
  };

  const bridge = native();
  const Ctor = recognitionCtor();

  function startSegment() {
    const startedAt = Date.now();
    if (bridge?.listen) {
      const id = `l${++seq}`;
      let heard = false;
      callbacks.set(id, (type, payload) => {
        if (type === "partial") {
          heard ||= !!payload;
          onText(join(payload));
        } else if (type === "result") {
          callbacks.delete(id);
          if (payload) {
            heard = true;
            committed = join(payload);
            onText(committed);
          }
          segmentEnded(startedAt, heard);
        } else if (type === "error") {
          callbacks.delete(id);
          segmentEnded(startedAt, heard, payload === "no-speech" || payload === "error" ? undefined : payload);
        }
      });
      stopSegment = () => bridge.stopListen?.();
      bridge.listen(id, "en-US");
      return;
    }
    if (!Ctor) return fail("unsupported");
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    let segment = "";
    let errorCode: string | undefined;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) segment += `${r[0].transcript} `;
        else interim += r[0].transcript;
      }
      onText(join(`${segment}${interim}`));
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") errorCode = e.error;
    };
    rec.onend = () => {
      if (segment.trim()) committed = join(segment);
      segmentEnded(startedAt, !!segment.trim(), errorCode);
    };
    stopSegment = () => rec.stop();
    try {
      rec.start();
    } catch {
      fail("busy");
    }
  }

  startSegment();
  return stop;
}

// ---------------- Hook ----------------

export interface SpeechSupport {
  speak: boolean;
  listen: boolean;
  /** Android ilova ichida (tizim ovozi/tanuvchisi) */
  nativeApp: boolean;
  /** Eski ilova (1.2 va undan oldingi): ovoz ko'prigi va mikrofon ruxsati yo'q — yangilash kerak */
  outdatedApp: boolean;
}

let support: SpeechSupport | undefined;
const SERVER_SUPPORT: SpeechSupport = { speak: true, listen: true, nativeApp: false, outdatedApp: false };

/** Qurilma imkoniyatlari; serverda va gidratsiyada — "bor" deb hisoblanadi */
export function useSpeechSupport(): SpeechSupport {
  return useSyncExternalStore(
    () => () => {},
    () =>
      (support ??= {
        speak: canSpeak(),
        listen: canListen(),
        nativeApp: !!window.SATProApp,
        outdatedApp: !!window.SATProApp && typeof window.SATProApp.listen !== "function",
      }),
    () => SERVER_SUPPORT,
  );
}
