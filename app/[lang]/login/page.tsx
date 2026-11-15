import { localizedMetadata } from "@/shared/i18n";

export const generateMetadata = localizedMetadata("login", "/login", { robots: { index: false } });

export { LoginPage as default } from "@/pages/login";
