import i18n, { changeLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ru } from './ru';
import { en } from './en';

export type Locale = 'ru' | 'en';

export const defaultLocale: Locale = 'ru';

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

export function initI18n(locale: Locale = defaultLocale): void {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        ru: { translation: ru },
        en: { translation: en },
      },
      lng: locale,
      fallbackLng: defaultLocale,
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
}

export { i18n, changeLanguage };
export default i18n;
export { ru, en };