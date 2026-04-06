# MeshTalk Flutter

Flutter-прототип мессенджера в стиле Meshtastic:
- BLE onboarding (сначала подключение контроллера)
- никнейм при первом входе
- концепция друзей через QR
- E2E шифрование сообщений (ключ только у получателя)
- хранение переписок локально
- светлая/тёмная темы
- RU по умолчанию + EN

## 1) Установка Flutter и SDK

### macOS
1. Установить Xcode (для iOS, опционально).
2. Установить Android Studio + Android SDK + Platform Tools.
3. Установить Flutter:
   ```bash
   git clone https://github.com/flutter/flutter.git -b stable ~/development/flutter
   echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.zshrc
   source ~/.zshrc
   ```
4. Проверить окружение:
   ```bash
   flutter doctor
   ```

### Windows/Linux
- Установить Flutter по официальной инструкции: https://docs.flutter.dev/get-started/install
- Установить Android Studio + SDK + device/emulator.

## 2) Создать платформенные папки (если их нет)

В этой версии сгенерирован только `lib/` и конфиги.
Создай платформенные каталоги:

```bash
flutter create .
```

> Команда добавит `android/`, `ios/`, `web/` и т.п., не затрагивая `lib` с текущим кодом.

## 3) Установить зависимости

```bash
flutter pub get
```

## 4) Разрешения BLE/Camera

### Android (`android/app/src/main/AndroidManifest.xml`)
Добавить:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

### iOS (`ios/Runner/Info.plist`)
Добавить ключи:
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`
- `NSCameraUsageDescription`

## 5) Запуск

```bash
flutter run
```

Для release Android:
```bash
flutter build apk --release
```

## 6) Архитектура

Смотри файл `PROJECT_STRUCTURE.md`.

## Важно

Это рабочий каркас прототипа. Для production нужно дополнительно:
- полноценный BLE transport (характеристики/MTU/фрагментация/ретраи)
- mesh packet routing/ack/TTL
- обработка фоновых режимов
- безопасная валидация публичных ключей и форматов payload
- тесты, crash/reporting, hardening безопасности
