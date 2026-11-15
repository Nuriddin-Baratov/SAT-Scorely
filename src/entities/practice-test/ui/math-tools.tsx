"use client";

import { useI18n } from "@/shared/i18n";
import { DesmosPanel } from "@/shared/ui/desmos";
import { FormulaSheet } from "@/shared/ui/formula-sheet";

/** Matematika savollari uchun yordamchi vositalar: Desmos va formulalar varag'i */
export function MathTools() {
  const { t, locale } = useI18n();
  return (
    <div className="space-y-3">
      <DesmosPanel locale={locale} labels={t.desmos} />
      <FormulaSheet labels={t.formulas} />
    </div>
  );
}
