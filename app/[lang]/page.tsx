import { HomePage } from "@/pages/home";
import { resolveLocale } from "@/shared/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return <HomePage locale={await resolveLocale(params)} />;
}
