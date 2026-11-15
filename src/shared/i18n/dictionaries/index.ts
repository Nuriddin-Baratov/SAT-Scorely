import type { Locale } from "../config";
import { en } from "./en";
import { ru } from "./ru";
import { uz, type Dictionary } from "./uz";

const dictionaries: Record<Locale, Dictionary> = { uz, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
