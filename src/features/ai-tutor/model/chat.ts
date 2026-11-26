"use client";

import type { StudentProfile } from "@/entities/student";

export interface TutorMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Ekranda ko'rsatish uchun kichik nusxa (data URL) */
  thumb?: string;
  /** Yuborish uchun to'liq rasm (faqat xotirada, saqlanmaydi) */
  image?: { type: string; data: string };
  status?: "streaming" | "error" | "refused";
}

export interface TutorStatus {
  enabled: boolean;
  user: boolean;
  plan?: "free" | "pro";
  planUntil?: string | null;
  used?: number;
  limit?: number;
}

/** Suhbat shu qurilmada saqlanadi (bulutga sinxronlanmaydi) */
const KEY = "satpro.tutor.v1";
/** Boshqa sahifadan (masalan, Speaking) tayyor savol */
export const DRAFT_KEY = "satpro.tutor.draft";

export function loadChat(): TutorMessage[] {
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as TutorMessage[];
    return Array.isArray(list) ? list.filter((m) => m && typeof m.text === "string").map((m) => ({ ...m, status: m.status === "streaming" ? "error" : m.status })) : [];
  } catch {
    return [];
  }
}

export function saveChat(list: TutorMessage[]) {
  try {
    // Oxirgi 40 ta xabar, to'liq rasmlarsiz
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-40).map((m) => ({ ...m, image: undefined }))));
  } catch {
    // joy yetmasa — saqlamaymiz
  }
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Rasmni kichraytiradi: yuborish uchun (≤1600px JPEG) va ko'rsatish uchun (≤360px) */
export async function prepareImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const draw = (max: number, quality: number) => {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  };
  const full = draw(1600, 0.85);
  const thumb = draw(360, 0.7);
  bitmap.close();
  return { image: { type: "image/jpeg", data: full.slice(full.indexOf(",") + 1) }, thumb };
}

/** O'quvchi haqida qisqa ma'lumot — shaxsiy reja va daraja uchun */
export function profileContext(profile: StudentProfile | null | undefined) {
  if (!profile) return "";
  const weak = Object.entries(profile.domainRatings ?? {})
    .filter(([, r]) => typeof r === "number" && r <= 2)
    .map(([d]) => d);
  return [
    `target SAT score ${profile.targetScore}`,
    profile.testDate ? `test date ${profile.testDate}` : "",
    `level ${profile.level}, English ${profile.englishLevel}, grade ${profile.grade}`,
    profile.lastScore?.rw || profile.lastScore?.math ? `last score R&W ${profile.lastScore.rw ?? "?"}, Math ${profile.lastScore.math ?? "?"}` : "",
    weak.length ? `weak domains: ${weak.join(", ")}` : "",
    `studies ${profile.studyDays?.length ?? 0} days/week, ${profile.sessionMinutes} min per session`,
  ]
    .filter(Boolean)
    .join("; ");
}

export type SendResult = "ok" | "login" | "limit" | "off" | "error";

/** Xabarni yuboradi; javob bo'laklari `onText` ga keladi */
export async function sendChat(
  history: TutorMessage[],
  { locale, context, signal, onText }: { locale: string; context: string; signal: AbortSignal; onText: (text: string, status?: TutorMessage["status"]) => void },
): Promise<SendResult> {
  const usable = history.filter((m) => !m.status);
  // To'liq rasm faqat oxirgi xabarda (oldingilari — belgi bilan matn)
  const messages = usable.map((m, i) => ({ role: m.role, text: m.thumb && !m.text ? "[photo]" : m.text, image: i === usable.length - 1 ? m.image : undefined }));
  const res = await fetch("/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale, context, messages }),
    signal,
  });
  if (res.status === 401) return "login";
  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return body.error === "limit" ? "limit" : "error";
  }
  if (res.status === 503) return "off";
  if (!res.ok || !res.body) return "error";

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    const mark = text.indexOf("\u0000");
    if (mark >= 0) {
      const code = text.slice(mark + 1);
      if (code.startsWith("refused")) {
        onText("", "refused");
        return "ok";
      }
      if (code.startsWith("error")) {
        onText(text.slice(0, mark), "error");
        return "error";
      }
    }
    onText(text);
  }
  onText(text.trim() ? text : "", text.trim() ? undefined : "error");
  return text.trim() ? "ok" : "error";
}
