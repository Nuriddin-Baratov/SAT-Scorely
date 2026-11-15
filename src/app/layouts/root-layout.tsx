import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";

import { siteConfig } from "@/shared/config";
import { getDictionary, languageAlternates, localizePath, resolveLocale, type Locale } from "@/shared/i18n";
import { themeInitScript } from "@/features/toggle-theme";
import { AchievementToaster } from "@/widgets/achievement-toaster";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteSidebar } from "@/widgets/site-sidebar";
import { Providers } from "../providers";
import "../styles/globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "cyrillic-ext"],
  weight: ["500", "600", "700", "800"],
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { meta } = getDictionary(locale);
  return {
    title: { default: `${siteConfig.name} — ${meta.tagline}`, template: `%s · ${siteConfig.name}` },
    description: meta.description,
    alternates: { canonical: localizePath(locale, "/"), languages: languageAlternates("/") },
    icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#09090f" },
  ],
};

export function RootLayout({ children, locale }: Readonly<{ children: ReactNode; locale: Locale }>) {
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${jakarta.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <Providers locale={locale}>
          <div className="flex min-h-dvh flex-col lg:flex-row">
            <SiteSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              {children}
              <SiteFooter />
            </div>
          </div>
          <AchievementToaster />
        </Providers>
      </body>
    </html>
  );
}
