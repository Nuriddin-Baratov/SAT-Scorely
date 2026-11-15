import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Ma'lumotlar bazasi drayverlari (PGlite WASM fayllari bilan) bundle qilinmaydi.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // Tailwind CSS postcss.config.mjs orqali ulanadi (Next.js tavsiya qilgan usul).
};

export default nextConfig;
