/* SAT Pro service worker — oflayn ishlash uchun oddiy kesh strategiyasi. */
const VERSION = "satpro-v5"; // yangi ikonka — eski kesh tozalanadi
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const PRECACHE = ["/icon-192.png", "/icon-512.png", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/** Avval tarmoq, bo'lmasa kesh (sahifalar va RSC so'rovlari uchun) */
async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    // Oflayn va sahifa keshda yo'q — shu tildagi bosh sahifani ko'rsatamiz
    if (request.mode === "navigate") {
      const lang = new URL(request.url).pathname.split("/")[1] || "uz";
      const home = await cache.match(`/${lang}`, { ignoreVary: true });
      if (home) return home;
    }
    throw new Error("offline");
  }
}

/** Avval kesh (o'zgarmas fayllar: JS, CSS, shriftlar, rasmlar) */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Lokal ishlab chiqishda kesh eski kodni berib, hydration xatolariga sabab bo'ladi.
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/download/")) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});
