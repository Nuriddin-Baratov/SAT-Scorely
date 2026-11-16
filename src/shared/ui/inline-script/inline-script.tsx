"use client";

/**
 * Sahifa chizilishidan oldin bajariladigan inline skript (Next.js “Preventing flash” qo'llanmasi bo'yicha).
 * Serverda `text/javascript` — brauzer HTML'ni o'qiyotganda darhol bajaradi;
 * client navigatsiyada `text/plain` — React “script tag” ogohlantirishini bermaydi.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
