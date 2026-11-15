import { localizedMetadata } from "@/shared/i18n";

export const generateMetadata = localizedMetadata("simulator", "/simulator", { robots: { index: false } });

export { SimulatorPage as default } from "@/pages/simulator";
