import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Ma'lumotlar bazasi drayverlari (PGlite WASM fayllari bilan) bundle qilinmaydi.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // Boshqa noutbuk/telefondan (lokal tarmoq yoki Radmin VPN 26.x.x.x) `next dev`ga kirilganda
  // sahifa skriptlari bloklanmasligi uchun (aks holda forma ishlamaydi — ro'yxatdan o'tib bo'lmaydi).
  allowedDevOrigins: ["26.*.*.*", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // Telefon faylni ilova deb tanishi va yuklab olishi uchun
  async headers() {
    return [
      {
        source: "/download/SAT-Pro.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: 'attachment; filename="SAT-Pro.apk"' },
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
        ],
      },
    ];
  },
  // Tailwind CSS postcss.config.mjs orqali ulanadi (Next.js tavsiya qilgan usul).
};

export default nextConfig;
