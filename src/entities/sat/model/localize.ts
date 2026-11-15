import type { Locale } from "@/shared/i18n";

import { curriculumEn, curriculumRu } from "./curriculum-i18n";
import type { Domain, Section, Skill } from "./types";

const texts = { ru: curriculumRu, en: curriculumEn } as const;

/** Bo'lim tavsifi va asosiy jihatlari tanlangan tilda */
export function localizeSection(section: Section, locale: Locale): Section {
  if (locale === "uz") return section;
  const t = texts[locale].sections[section.id];
  return { ...section, description: t.description, highlights: t.highlights };
}

export function domainDescription(domain: Pick<Domain, "id" | "description">, locale: Locale) {
  return locale === "uz" ? domain.description : texts[locale].domains[domain.id];
}

export interface LocalizedSkill extends Skill {
  /** Tanlangan tildagi nom */
  displayName: string;
}

/** Ko'nikma nomi, tavsifi, strategiyalari va tuzoqlari tanlangan tilda */
export function localizeSkill(skill: Skill, locale: Locale): LocalizedSkill {
  if (locale === "uz") return { ...skill, displayName: skill.nameUz };
  const t = texts[locale].skills[skill.id];
  if (!t) return { ...skill, displayName: skill.name };
  return {
    ...skill,
    displayName: locale === "ru" ? (t.name ?? skill.name) : skill.name,
    summary: t.summary,
    strategies: t.strategies,
    traps: t.traps,
  };
}
