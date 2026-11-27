import Anthropic from "@anthropic-ai/sdk";
import { connection } from "next/server";

import {
  aiConfigured,
  assertSameOrigin,
  databaseConfigured,
  getCurrentUser,
  handleError,
  json,
  rateLimit,
  readJson,
  requireUser,
} from "@/shared/server";

/** Javob uzun bo'lishi mumkin (masalan, 10 ta savolli test) */
export const maxDuration = 120;

const MODEL = "claude-opus-5-5";
const MAX_MESSAGES = 20;
const MAX_TEXT = 6_000;
/** base64 ≈ 3.75 MB rasm */
const MAX_IMAGE = 5_000_000;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const LANGS: Record<string, string> = { uz: "Uzbek (Latin script)", ru: "Russian", en: "English" };

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  image?: { type: string; data: string };
}

function systemPrompt(locale: string, context: string) {
  return `You are "SAT Pro AI ustoz", a patient, encouraging tutor that helps high-school students in Uzbekistan prepare for the Digital SAT (Math and Reading & Writing). Reply in ${LANGS[locale] ?? LANGS.uz}, unless the student clearly writes in another language. Keep SAT terms, answer choices and English passages in English.

How to teach:
- When the student sends a problem (text or photo), solve it step by step with short numbered steps, then state the final answer clearly. If a photo is unclear, say what you can read and ask for a clearer one.
- If the student asks for a hint, or says not to reveal the answer, give only one guiding hint or question and do NOT state the final answer or the correct choice.
- When the student shares their own wrong answer, find exactly where the reasoning went wrong before showing the correct method.
- For "similar problems", write new SAT-style problems of the same type and difficulty, with answers at the end.
- For a study plan, use the student context below and give a concrete day-by-day plan.
- Stay on SAT, school math, English and studying. Politely steer other requests back to studying.

Formatting (the app renders a small subset of Markdown):
- Use short paragraphs, numbered or "-" lists, **bold** for key results, and "### " for section titles when the answer is long.
- Do not use LaTeX or $ signs. Write math in plain text with Unicode: x², √(x+1), 3/4, ≤, ≥, π, ·.
- Be concise: no long introductions, no repeating the question.

Student context (may be empty): ${context || "none"}`;
}

const isMessage = (m: unknown): m is ChatMessage => {
  if (!m || typeof m !== "object") return false;
  const x = m as ChatMessage;
  if ((x.role !== "user" && x.role !== "assistant") || typeof x.text !== "string" || x.text.length > MAX_TEXT) return false;
  if (x.image === undefined) return true;
  return !!x.image && IMAGE_TYPES.includes(x.image.type as ImageType) && typeof x.image.data === "string" && x.image.data.length <= MAX_IMAGE;
};

/** Holat: AI ulanganmi, tarif va bugungi savollar soni */
export async function GET() {
  await connection();
  try {
    const enabled = aiConfigured();
    if (!databaseConfigured()) return json({ enabled, user: false });
    const user = await getCurrentUser();
    if (!user) return json({ enabled, user: false });
    return json({ enabled, user: true });
  } catch (error) {
    return handleError(error);
  }
}

/** Suhbat: javob matn sifatida oqim bilan keladi. Oxirida xizmat belgisi bo'lishi mumkin: `\u0000refused` / `\u0000error`. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    if (!aiConfigured()) return json({ error: "ai-off" }, 503);
    if (!rateLimit(request, `tutor:${user.id}`, 20)) return json({ error: "rate" }, 429);

    const body = await readJson<{ messages?: unknown[]; locale?: string; context?: string }>(request, 6_000_000);
    const list = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
    if (!list.length || !list.every(isMessage)) return json({ error: "invalid" }, 400);
    // Ketma-ket bir xil roldagi xabarlar (masalan, javobi kelmagan savol) bittaga qo'shiladi
    const messages: ChatMessage[] = [];
    for (const m of list as ChatMessage[]) {
      const prev = messages.at(-1);
      if (prev && prev.role === m.role) messages[messages.length - 1] = { role: m.role, text: `${prev.text}

${m.text}`, image: m.image ?? prev.image };
      else messages.push({ role: m.role, text: m.text, image: m.image });
    }
    // Suhbat foydalanuvchi xabari bilan boshlanib, u bilan tugashi kerak
    while (messages.length && messages[0].role !== "user") messages.shift();
    const last = messages.at(-1);
    if (!last || last.role !== "user" || (!last.text.trim() && !last.image)) return json({ error: "invalid" }, 400);


    const params: Anthropic.Beta.MessageCreateParamsStreaming["messages"] = messages.map((m, i) => {
      const isLast = i === messages.length - 1;
      // Rasm faqat oxirgi xabarda yuboriladi (oldingilari — matn bilan belgi)
      if (m.role === "user" && m.image && isLast) {
        return {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: m.image.type as ImageType, data: m.image.data } },
            { type: "text", text: m.text.trim() || "Solve this problem." },
          ],
        };
      }
      return { role: m.role, content: (m.image ? "[photo] " : "") + (m.text.trim() || "…") };
    });

    const client = new Anthropic();
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 8_000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: systemPrompt(String(body.locale ?? "uz"), String(body.context ?? "").slice(0, 600)),
      messages: params,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(encoder.encode("\u0000refused"));
          }
        } catch (error) {
          if (!(error instanceof Anthropic.APIUserAbortError)) console.error("[tutor]", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
          try {
            controller.enqueue(encoder.encode("\u0000error"));
          } catch {
            // mijoz uzilgan
          }
        } finally {
          try {
            controller.close();
          } catch {
            // allaqachon yopilgan
          }
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    });
  } catch (error) {
    return handleError(error);
  }
}
