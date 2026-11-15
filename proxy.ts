import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE, defaultLocale, hasLocale, type Locale } from "@/shared/i18n/config";

/** Cookie → Accept-Language → standart til */
function detectLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (hasLocale(fromCookie)) return fromCookie;

  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  return (preferred.find((p) => hasLocale(p.lang))?.lang as Locale | undefined) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (hasLocale(first)) {
    // Tanlangan tilni eslab qolamiz — keyingi prefikssiz havolalar shu tilga yo'naltiriladi.
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${detectLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Ichki yo'llar, API va fayllar (nuqtali) — tegilmaydi.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
