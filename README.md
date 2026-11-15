# Scorely — Digital SAT tayyorgarlik platformasi

Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, [FSD](https://feature-sliced.design) arxitekturasi.
Interfeys uch tilda: o'zbek, rus, ingliz (`/uz`, `/ru`, `/en`).

## Ishga tushirish

```bash
cp .env.example .env.local   # sozlamalar (ixtiyoriy — bo'sh qolsa ham ishlaydi)
npm install
npm run dev                  # http://localhost:3000
npm run build
npm run lint                 # ESLint
npm run lint:fsd             # Steiger — FSD qoidalarini tekshiradi
```

## Ma'lumotlar bazasi

- `DATABASE_URL` **bo'sh** bo'lsa — lokal **PGlite** (Postgres WASM) ishlatiladi, ma'lumotlar `.data/pglite` papkasida.
  Hech narsa o'rnatish shart emas.
- Production uchun Vercel Postgres / Neon / istalgan Postgres: `DATABASE_URL=postgres://…` qo'ying.
- Jadvallar birinchi so'rovda avtomatik yaratiladi (`src/shared/server/schema.ts`).

Server ishlamasa ham sayt to'liq ishlaydi — progress brauzerda (localStorage) saqlanadi.
Login qilinganda u bulut bilan sinxronlanadi.

## Telegram bot

1. @BotFather'da bot yarating, tokenni oling.
2. `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC…
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=ScorelySatBot   # @ belgisisiz
   TELEGRAM_WEBHOOK_SECRET=<tasodifiy uzun satr>
   APP_URL=https://sizning-domeningiz.uz             # https bo'lishi shart
   ```
3. Saytni deploy qiling, so'ng: `npm run telegram:webhook`
4. Foydalanuvchi: Sozlamalar → Telegram → “Telegram'ni ulash”.

Bot buyruqlari: `/daily`, `/stats`, `/stop`, `/resume`. Har kuni 09:00 (Toshkent) kunlik savol yuboriladi —
`vercel.json` dagi cron `/api/cron/daily` ni chaqiradi (`CRON_SECRET` kerak).

> Lokal kompyuterda Telegram webhook ishlamaydi (Telegram faqat ochiq https manzilga yuboradi).
> Sinash uchun deploy qiling yoki tunnel (masalan, `cloudflared`) ishlating.

## Tuzilma

```
app/                  # Next.js marshrutlari: app/[lang]/… sahifalar, app/api/… backend
proxy.ts              # tilga yo'naltirish (/ → /uz)
src/
  app/                # layout, providerlar, global stillar
  pages/              # sahifalar
  widgets/            # sidebar, footer, kabinet, nishon bildirishnomasi
  features/           # test ishlash, simulyator, auth, sinxronizatsiya, Telegram bot, …
  entities/           # sat, practice-test, study-plan, gamification, mistake, vocab, user, student
  shared/
    i18n/             # lug'atlar (uz/ru/en), til yordamchilari
    server/           # faqat server: DB, auth, sinxronizatsiya, reyting, sinflar, Telegram
    api/ lib/ ui/ config/
```

## Qoidalar

- Import faqat **pastdagi** qatlamlardan: `app → pages → widgets → features → entities → shared`.
- Bir qatlamdagi slice'lar bir-birini import qilmaydi (kerak bo'lsa — `@x` cross-import).
- Har bir slice tashqariga faqat `index.ts` (public API) orqali eksport qiladi.
- Matnlar komponentda yozilmaydi — `src/shared/i18n/dictionaries/{uz,ru,en}.ts` ga qo'shiladi.
- `@/shared/server` faqat route handler'lar va server kodidan import qilinadi.

## Yangi sahifa qo'shish

1. `src/pages/about/ui/about-page.tsx` + `src/pages/about/index.ts`
2. `app/[lang]/about/page.tsx`:
   ```ts
   import { localizedMetadata } from "@/shared/i18n";
   export const generateMetadata = localizedMetadata("about", "/about");
   export { AboutPage as default } from "@/pages/about";
   ```
3. Sarlavha va matnlarni uchala lug'atga qo'shing (`meta.pages.about`).
# SAT-Scorely
