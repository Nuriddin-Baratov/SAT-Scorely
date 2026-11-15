import { useSyncExternalStore } from "react";

/**
 * localStorage'ga bog'langan kichik reaktiv store.
 * SSR va gidratsiya paytida `undefined` qaytaradi — bu "hali yuklanmagan" degani.
 */
export function createStorageStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;

  function read(): T {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      raw = null;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        cachedValue = fallback;
      }
    }
    return cachedValue;
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function set(value: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Saqlash imkonsiz (private rejim) — xotirada qoladi.
      cachedRaw = undefined;
      cachedValue = value;
    }
    emit();
  }

  function clear() {
    try {
      window.localStorage.removeItem(key);
    } catch {
      cachedValue = fallback;
    }
    emit();
  }

  function useValue(): T | undefined {
    return useSyncExternalStore(subscribe, read, () => undefined);
  }

  return { get: read, set, clear, subscribe, useValue };
}
