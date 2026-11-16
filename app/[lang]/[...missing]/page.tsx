import { notFound } from "next/navigation";

// Bu sahifa har doim 404 qaytaradi — “instant navigation” tekshiruvi kerak emas.
export const instant = false;

/** Mavjud bo'lmagan har qanday manzil — tilga mos 404 sahifasi (layout ichida). */
export default function MissingPage() {
  notFound();
}
