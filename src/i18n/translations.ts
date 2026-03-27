import {Locale} from '../types/models';

export const translations: Record<Locale, Record<string, string>> = {
  ru: {
    setupTitle: 'Первичная настройка',
    connectBle: 'Подключить BLE LoRa-контроллер',
    connected: 'Контроллер подключён',
    enterNickname: 'Введите ник',
    continue: 'Продолжить',
    chats: 'Чаты',
    friends: 'Друзья',
    settings: 'Настройки',
    addFriend: 'Добавить друга',
    scanQr: 'Сканировать QR',
    myQr: 'Мой QR',
    messagePlaceholder: 'Сообщение',
    language: 'Язык',
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная'
  },
  en: {
    setupTitle: 'Initial setup',
    connectBle: 'Connect BLE LoRa controller',
    connected: 'Controller connected',
    enterNickname: 'Enter nickname',
    continue: 'Continue',
    chats: 'Chats',
    friends: 'Friends',
    settings: 'Settings',
    addFriend: 'Add friend',
    scanQr: 'Scan QR',
    myQr: 'My QR',
    messagePlaceholder: 'Message',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark'
  }
};
