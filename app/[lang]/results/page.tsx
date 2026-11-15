import { localizedMetadata } from "@/shared/i18n";

export const generateMetadata = localizedMetadata("results", "/results", { robots: { index: false } });

export { ResultsPage as default } from "@/pages/results";
