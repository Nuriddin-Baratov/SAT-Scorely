export const siteConfig = {
  name: "SAT Pro",
} as const;

/** Tilsiz yo'llar. Havola uchun `localizePath(locale, routes.x)` yoki `useI18n().href(routes.x)`. */
export const routes = {
  home: "/",
  satGuide: "/sat",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  tests: "/tests",
  test: (id: string) => `/tests/${id}`,
  certificate: (id: string) => `/certificate?id=${encodeURIComponent(id)}`,
  verify: (code: string) => `/verify?code=${encodeURIComponent(code)}`,
  results: "/results",
  calculator: "/calculator",
  practice: "/practice",
  mistakes: "/mistakes",
  vocabulary: "/vocabulary",
  achievements: "/achievements",
  simulator: "/simulator",
  settings: "/settings",
  login: "/login",
  session: (id: string) => `/session?id=${encodeURIComponent(id)}`,
  install: "/install",
  leaderboard: "/leaderboard",
  teacher: "/teacher",
} as const;
