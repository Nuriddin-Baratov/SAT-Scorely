"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "denied" | "unsupported";

/** Mikrofondan ovoz yozish (MediaRecorder) — natija qayta eshitish uchun URL */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  /** Yaratilgan barcha yozuvlar — natija sahifasida qayta eshitish uchun saqlanadi, chiqishda tozalanadi */
  const made = useRef<string[]>([]);

  const release = () => rec.current?.stream.getTracks().forEach((t) => t.stop());

  const start = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        const next = URL.createObjectURL(blob);
        made.current.push(next);
        setUrl(next);
        stream.getTracks().forEach((t) => t.stop());
        setState("idle");
      };
      rec.current = recorder;
      recorder.start();
      setState("recording");
      return true;
    } catch {
      setState("denied");
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    if (rec.current?.state === "recording") rec.current.stop();
  }, []);

  const reset = useCallback(() => setUrl(null), []);

  useEffect(
    () => () => {
      if (rec.current?.state === "recording") rec.current.stop();
      release();
      made.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  return { state, url, start, stop, reset };
}
