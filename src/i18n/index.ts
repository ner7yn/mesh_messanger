import { ru } from './ru';
import { en } from './en';

export type Locale = 'ru' | 'en';

export const translations = {
  ru,
  en,
} as const;

export type TranslationKeys = typeof ru;

export const defaultLocale: Locale = 'ru';

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

export function getTranslation(locale: Locale): TranslationKeys {
  return translations[locale] || translations[defaultLocale];
}

export { ru, en };