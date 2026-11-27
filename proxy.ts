import { NextResponse, type NextRequest } from "next/server";

import { TEST_PAGE_IDS } from "@/entities/practice-test/model/test-ids";
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

/** `app/[lang]/` ichidagi sahifalar (birinchi segment). Yangi sahifa qo'shilsa — shu yerga ham. */
const PAGES = new Set([
  "",
  "achievements",
  "calculator",
  "certificate",
  "dashboard",
  "install",
  "leaderboard",
  "listening",
  "login",
  "mistakes",
  "onboarding",
  "plan",
  "practice",
  "quiz",
  "results",
  "sat",
  "session",
  "settings",
  "simulator",
  "speaking",
  "teacher",
  "tests",
  "tutor",
  "verify",
  "vocabulary",
]);

/** `/<til>/...` dan keyingi qism mavjud sahifami */
function isKnownPage(rest: string[]) {
  const [page = "", id, ...extra] = rest;
  if (extra.length || !PAGES.has(page)) return false;
  if (id === undefined) return true;
  return page === "tests" && TEST_PAGE_IDS.includes(id);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first, ...rest] = pathname.split("/");

  if (hasLocale(first)) {
    // Noma'lum manzil — Cache Components bilan sahifa ichidagi notFound() oqim boshlangach ishlaydi
    // va status 200 bo'lib qoladi. Shuning uchun tekshiruv shu yerda: tilga mos 404 sahifasi, status 404.
    if (!isKnownPage(rest.filter(Boolean))) {
      const url = request.nextUrl.clone();
      url.pathname = `/${first}/_not-found-page`;
      return NextResponse.rewrite(url, { status: 404 });
    }
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
