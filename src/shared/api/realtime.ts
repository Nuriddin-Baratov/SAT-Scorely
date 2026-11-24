"use client";

import type { RealtimeChannel, RealtimeClient } from "@supabase/realtime-js";
import { useEffect, useEffectEvent } from "react";

/**
 * Real-time signallar (Supabase Realtime). Signalda ma'lumot YO'Q — faqat "o'zgardi" degan xabar;
 * ma'lumotning o'zi odatdagidek himoyalangan API orqali qayta olinadi.
 * Supabase sozlanmagan yoki ulanmagan bo'lsa — 30 soniyada bir tekshirishga o'tadi.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SB_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SB_SUPABASE_ANON_KEY;
const FALLBACK_MS = 30_000;
const COALESCE_MS = 250;

type Listener = () => void;

interface Topic {
  listeners: Set<Listener>;
  channel: RealtimeChannel | null;
  live: boolean;
}

const topics = new Map<string, Topic>();
let clientPromise: Promise<RealtimeClient> | null = null;

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  // Kutubxona alohida yuklanadi — birinchi ochilishni sekinlashtirmaydi
  clientPromise ??= import("@supabase/realtime-js").then(async ({ RealtimeClient: Client }) => {
    const client = new Client(`${SUPABASE_URL.replace(/^http/, "ws")}/realtime/v1`, { params: { apikey: SUPABASE_KEY } });
    await client.setAuth(SUPABASE_KEY);
    return client;
  });
  return clientPromise.catch(() => {
    clientPromise = null;
    return null;
  });
}

async function open(name: string, topic: Topic) {
  const client = await getClient();
  if (!client || topic.channel || topics.get(name) !== topic) return;
  const notify = () => topic.listeners.forEach((listener) => listener());
  let wasLive = false;
  topic.channel = client
    .channel(name, { config: { private: true } })
    .on("broadcast", { event: "*" }, notify)
    .subscribe((status) => {
      topic.live = status === "SUBSCRIBED";
      // Uzilib qayta ulandi — oradagi o'zgarishlarni o'tkazib yubormaslik uchun
      if (topic.live && wasLive) notify();
      if (topic.live) wasLive = true;
    });
}

function listen(name: string, listener: Listener) {
  let topic = topics.get(name);
  if (!topic) {
    topic = { listeners: new Set(), channel: null, live: false };
    topics.set(name, topic);
    void open(name, topic);
  }
  const current = topic;
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
    // Sahifalar orasida o'tganda kanal bekorga yopilib-ochilmasin
    window.setTimeout(() => {
      if (current.listeners.size || topics.get(name) !== current) return;
      topics.delete(name);
      if (current.channel) void getClient()?.then((client) => client?.removeChannel(current.channel!));
    }, 5_000);
  };
}

/**
 * Mavzuni tinglaydi: signal kelganda, ilovaga qaytilganda yoki internet tiklanganda `onChange` chaqiriladi.
 * `topic` — `leaderboard`, `user:<id>`, `teacher:<id>` yoki `null` (tinglamaslik).
 */
export function useLive(topic: string | null, onChange: () => void) {
  const fire = useEffectEvent(onChange);

  useEffect(() => {
    if (!topic) return;
    let timer: number | undefined;
    // Ketma-ket kelgan signallar bitta yangilanishga birlashadi
    const trigger = () => {
      if (timer === undefined) {
        timer = window.setTimeout(() => {
          timer = undefined;
          fire();
        }, COALESCE_MS);
      }
    };
    const stop = listen(topic, trigger);
    const onVisible = () => document.visibilityState === "visible" && trigger();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && !topics.get(topic)?.live) trigger();
    }, FALLBACK_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", trigger);
    return () => {
      stop();
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", trigger);
    };
  }, [topic]);
}
