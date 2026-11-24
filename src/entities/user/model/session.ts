"use client";

import { useSyncExternalStore } from "react";

import { api } from "@/shared/api";

export type Role = "student" | "teacher";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  publicProfile: boolean;
}

export interface TelegramStatus {
  available: boolean;
  bot: string | null;
  linked: boolean;
  dailyEnabled: boolean;
}

export type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "offline" }
  | { status: "user"; user: User; telegram: TelegramStatus };

let state: SessionState = { status: "loading" };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

/** Serverdan joriy sessiyani qayta o'qiydi */
export function refreshSession() {
  inflight ??= fetch("/api/auth/me", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data: { user: User | null; telegram?: TelegramStatus; database?: boolean }) =>
      set(
        data.database === false
          ? { status: "offline" }
          : data.user
            ? { status: "user", user: data.user, telegram: data.telegram! }
            : { status: "guest" },
      ),
    )
    // Server/baza mavjud bo'lmasa — sayt baribir brauzer rejimida ishlaydi
    // Kirgan foydalanuvchi qisqa uzilishda "chiqib ketgan" bo'lib qolmasin
    .catch(() => {
      if (state.status !== "user") set({ status: "offline" });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (state.status === "loading" && !inflight) void refreshSession();
  return () => listeners.delete(listener);
}

const serverState: SessionState = { status: "loading" };

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

// ---------------- API ----------------

export const authApi = {
  async login(email: string, password: string) {
    await api("/api/auth/login", { method: "POST", json: { email, password } });
    await refreshSession();
  },
  async register(input: { name: string; email: string; password: string; role: Role }) {
    await api("/api/auth/register", { method: "POST", json: input });
    await refreshSession();
  },
  async logout() {
    await api("/api/auth/logout", { method: "POST" });
    await refreshSession();
  },
  async update(patch: { name?: string; publicProfile?: boolean }) {
    await api("/api/auth/me", { method: "PATCH", json: patch });
    await refreshSession();
  },
  async deleteAccount() {
    await api("/api/auth/me", { method: "DELETE" });
    await refreshSession();
  },
};
