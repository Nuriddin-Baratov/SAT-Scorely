import { localizedMetadata } from "@/shared/i18n";

export const generateMetadata = localizedMetadata("settings", "/settings", { robots: { index: false } });

export { SettingsPage as default } from "@/pages/settings";
