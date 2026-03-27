import {translations} from './translations';
import {Locale} from '../types/models';

export const t = (locale: Locale, key: string): string => {
  return translations[locale][key] ?? key;
};
