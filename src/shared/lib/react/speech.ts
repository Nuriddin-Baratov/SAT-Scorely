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

/** Ingliz tilidagi nutqni tinglaydi. Qaytaradi: to'xtatish funksiyasi. */
export function listen({ onText, onEnd, onError }: ListenHandlers): () => void {
  let finalText = "";
  let ended = false;
  const finish = (text: string) => {
    if (ended) return;
    ended = true;
    onEnd(text.trim());
  };

  const bridge = native();
  if (bridge?.listen) {
    const id = `l${++seq}`;
    let last = "";
    callbacks.set(id, (type, payload) => {
      if (type === "partial") onText((last = payload));
      else if (type === "result") {
        last = payload;
        onText(payload);
        callbacks.delete(id);
        finish(payload);
      } else if (type === "error") {
        callbacks.delete(id);
        onError?.(payload);
        finish(last);
      }
    });
    bridge.listen(id, "en-US");
    return () => bridge.stopListen?.();
  }

  const Ctor = recognitionCtor();
  if (!Ctor) {
    onError?.("unsupported");
    finish("");
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += `${r[0].transcript} `;
      else interim += r[0].transcript;
    }
    onText(`${finalText}${interim}`.trim());
  };
  rec.onerror = (e) => {
    if (e.error !== "no-speech" && e.error !== "aborted") onError?.(e.error);
  };
  rec.onend = () => finish(finalText);
  try {
    rec.start();
  } catch {
    onError?.("busy");
    finish("");
  }
  return () => rec.stop();
}

// ---------------- Hook ----------------

export interface SpeechSupport {
  speak: boolean;
  listen: boolean;
  /** Android ilova ichida (tizim ovozi/tanuvchisi) */
  nativeApp: boolean;
}

let support: SpeechSupport | undefined;
const SERVER_SUPPORT: SpeechSupport = { speak: true, listen: true, nativeApp: false };

/** Qurilma imkoniyatlari; serverda va gidratsiyada — "bor" deb hisoblanadi */
export function useSpeechSupport(): SpeechSupport {
  return useSyncExternalStore(
    () => () => {},
    () => (support ??= { speak: canSpeak(), listen: canListen(), nativeApp: !!window.SATProApp }),
    () => SERVER_SUPPORT,
  );
}
