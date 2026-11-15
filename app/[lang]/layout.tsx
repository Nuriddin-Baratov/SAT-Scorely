import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { RootLayout } from "@/app";
import { hasLocale, locales } from "@/shared/i18n";

export { generateMetadata, viewport } from "@/app";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <RootLayout locale={lang}>{children}</RootLayout>;
}
