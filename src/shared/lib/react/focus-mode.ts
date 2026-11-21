"use client";

import { useEffect } from "react";

/**
 * Fokus rejimi (test ishlash paytida): mobilda pastki navbar va yuqori sarlavha yashiriladi,
 * ekran to'liq savolga beriladi. `<html data-focus>` atributi orqali CSS boshqaradi.
 */
export function useFocusMode(active = true) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.dataset.focus = "1";
    return () => {
      delete root.dataset.focus;
    };
  }, [active]);
}
