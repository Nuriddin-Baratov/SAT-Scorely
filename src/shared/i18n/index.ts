export {
  LOCALE_COOKIE,
  defaultLocale,
  hasLocale,
  localeNames,
  localeTags,
  locales,
  localizePath,
  stripLocale,
  type Locale,
  type Localized,
} from "./config";
export { getDictionary, type Dictionary } from "./dictionaries";
export { formatDay, formatMinutes, monthShort, weekdayNames } from "./format";
export { languageAlternates, localizedMetadata, resolveLocale } from "./metadata";
export { I18nProvider, useI18n } from "./provider";
