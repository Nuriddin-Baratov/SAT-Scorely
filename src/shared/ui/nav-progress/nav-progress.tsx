"use client";

import { useLinkStatus } from "next/link";

/**
 * `<Link>` ichida ishlatiladi: havola bosilib, sahifa hali kelmagan paytda
 * ekran tepasida ingichka gradient progress chizig'i chiqadi.
 */
export function NavProgress() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]" aria-hidden>
      <span className="nav-progress block h-full bg-gradient-to-r from-accent-2 via-accent to-gold shadow-[0_0_12px_var(--accent)]" />
    </span>
  );
}
