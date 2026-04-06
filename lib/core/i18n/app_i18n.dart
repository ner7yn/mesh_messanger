import 'package:flutter/widgets.dart';

class AppI18n {
  final Locale locale;

  AppI18n(this.locale);

  static const LocalizationsDelegate<AppI18n> delegate = _AppI18nDelegate();

  static AppI18n of(BuildContext context) {
    final value = Localizations.of<AppI18n>(context, AppI18n);
    return value!;
  }

  static const Map<String, Map<String, String>> _localized = {
    'ru': {
      'onboarding_title': 'Подключите BLE контроллер',
      'onboarding_subtitle': 'Сначала подключение к LoRa устройству, затем никнейм',
      'scan_ble': 'Сканировать BLE',
      'next': 'Далее',
      'nickname': 'Никнейм',
      'save': 'Сохранить',
      'chats': 'Чаты',
      'friends': 'Друзья',
      'settings': 'Настройки',
      'message_hint': 'Сообщение...',
      'add_friend': 'Добавить друга',
      'my_qr': 'Мой QR',
      'scan_qr': 'Сканировать QR',
      'theme': 'Тема',
      'language': 'Язык',
      'light': 'Светлая',
      'dark': 'Тёмная',
      'system': 'Системная',
      'connected': 'Подключено',
      'not_connected': 'Не подключено',
      'empty_chats': 'Пока нет чатов',
      'empty_friends': 'Пока нет друзей',
      'ble_connection': 'BLE подключение',
      'device': 'Устройство',
      'version': 'Версия',
      'e2e_encryption': 'E2E Шифрование',
      'about': 'О приложении',
      'decor': 'Оформление',
      'List_friend': 'Список друзей',
      'add_friend_qr': 'Добавить друга через QR-код',
      'search': 'Поиск',
    },
    'en': {
      'onboarding_title': 'Connect BLE controller',
      'onboarding_subtitle': 'First connect LoRa device, then set nickname',
      'scan_ble': 'Scan BLE',
      'next': 'Next',
      'nickname': 'Nickname',
      'save': 'Save',
      'chats': 'Chats',
      'friends': 'Friends',
      'settings': 'Settings',
      'message_hint': 'Message...',
      'add_friend': 'Add friend',
      'my_qr': 'My QR',
      'scan_qr': 'Scan QR',
      'theme': 'Theme',
      'language': 'Language',
      'light': 'Light',
      'dark': 'Dark',
      'system': 'System',
      'connected': 'Connected',
      'not_connected': 'Not connected',
      'empty_chats': 'No chats yet',
      'empty_friends': 'No friends yet',
      'ble_connection': 'BLE connection',
      'device': 'Device',
      'version': 'Version',
      'e2e_encryption': 'E2E Encryption',
      'about': 'About',
      'decor': 'Decor',
      'List_friend': 'Friends list',
      'add_friend_qr': 'Add friend via QR code',
      'search': 'Search',
    },
  };

  String t(String key) => _localized[locale.languageCode]?[key] ?? _localized['ru']![key] ?? key;
}

class _AppI18nDelegate extends LocalizationsDelegate<AppI18n> {
  const _AppI18nDelegate();

  @override
  bool isSupported(Locale locale) => ['ru', 'en'].contains(locale.languageCode);

  @override
  Future<AppI18n> load(Locale locale) async => AppI18n(locale);

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppI18n> old) => false;
}
