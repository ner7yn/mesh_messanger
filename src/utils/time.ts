// src/utils/time.ts
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import i18n from '../i18n/index';

function getLocale() {
  return i18n.language === 'ru' ? ru : undefined;
}

/**
 * Format timestamp for chat list preview (e.g. "14:32" or "Mon" or "12 янв")
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const locale = getLocale();

  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return i18n.language === 'ru' ? 'вчера' : 'yesterday';
  }
  // Same year: show day + month abbreviated
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'd MMM', { locale });
  }
  return format(date, 'd MMM yyyy', { locale });
}

/**
 * Format timestamp for message bubble (e.g. "14:32")
 */
export function formatMessageTime(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm');
}

/**
 * Format date separator (e.g. "Сегодня", "Вчера", "12 января 2024")
 */
export function formatDateSeparator(timestamp: number): string {
  const date = new Date(timestamp);
  const locale = getLocale();

  if (isToday(date)) {
    return i18n.language === 'ru' ? 'Сегодня' : 'Today';
  }
  if (isYesterday(date)) {
    return i18n.language === 'ru' ? 'Вчера' : 'Yesterday';
  }
  return format(date, 'd MMMM yyyy', { locale });
}

/**
 * Relative time for friend last seen (e.g. "5 минут назад")
 */
export function formatRelativeTime(timestamp: number): string {
  const locale = getLocale();
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale });
}
