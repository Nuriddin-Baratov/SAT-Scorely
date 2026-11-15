import { SatGuidePage } from "@/pages/sat-guide";
import { localizedMetadata, resolveLocale } from "@/shared/i18n";

export const generateMetadata = localizedMetadata("sat", "/sat");

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return <SatGuidePage locale={await resolveLocale(params)} />;
}
