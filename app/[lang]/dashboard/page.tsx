import { localizedMetadata } from "@/shared/i18n";

export const generateMetadata = localizedMetadata("dashboard", "/dashboard", { robots: { index: false } });

export { DashboardPage as default } from "@/pages/dashboard";
