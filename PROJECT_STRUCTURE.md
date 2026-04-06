# PROJECT_STRUCTURE.md

```
meshtalk_flutter/
├─ pubspec.yaml                        # Flutter зависимости и метаданные проекта
├─ analysis_options.yaml               # Линтеры Dart
└─ lib/
   ├─ main.dart                        # Точка входа: инициализация хранилища + запуск приложения
   ├─ core/
   │  ├─ theme/
   │  │  └─ app_theme.dart             # Светлая/тёмная темы в стиле мессенджера
   │  └─ i18n/
   │     └─ app_i18n.dart              # Встроенная локализация RU/EN (по умолчанию RU)
   ├─ models/
   │  ├─ profile.dart                  # Профиль пользователя (nodeId, nickname, publicKey)
   │  ├─ friend.dart                   # Модель друга
   │  ├─ chat.dart                     # Модель чата
   │  └─ message.dart                  # Модель сообщения + статусы
   ├─ services/
   │  ├─ storage_service.dart          # Локальное хранение (Hive) + secure key storage
   │  ├─ crypto_service.dart           # E2E шифрование (X25519 + ChaCha20-Poly1305)
   │  ├─ ble_service.dart              # BLE scan/connect для LoRa-контроллера
   │  └─ mesh_service.dart             # Подготовка зашифрованных payload для mesh-транспорта
   ├─ state/
   │  ├─ app_state.dart                # Riverpod store: профиль, друзья, чаты, сообщения, настройки
   │  └─ router.dart                   # GoRouter: onboarding -> home tabs -> chat
   ├─ screens/
   │  ├─ onboarding/
   │  │  ├─ onboarding_ble_screen.dart       # Шаг 1: BLE подключение контроллера
   │  │  └─ onboarding_nickname_screen.dart  # Шаг 2: ввод никнейма и создание ключей
   │  ├─ home/
   │  │  └─ home_shell.dart            # Нижняя навигация (чаты/друзья/настройки)
   │  ├─ chats/
   │  │  ├─ chats_screen.dart          # Список чатов
   │  │  └─ chat_screen.dart           # Экран диалога (пузыри как в мессенджере)
   │  ├─ friends/
   │  │  └─ friends_screen.dart        # Друзья + мой QR + сканер QR
   │  └─ settings/
   │     └─ settings_screen.dart       # Тема + язык
   └─ widgets/                         # Резерв под переиспользуемые виджеты
```

## Поток первого входа
1. `OnboardingBleScreen`: сканирование BLE и подключение LoRa-контроллера.
2. `OnboardingNicknameScreen`: ввод никнейма.
3. Генерируется ключевая пара X25519, приватный ключ хранится в secure storage.
4. Профиль и настройки сохраняются локально.

## E2E шифрование
- Для каждого пользователя создаётся X25519 keypair.
- Шифрование: shared secret (X25519) + ChaCha20-Poly1305.
- Расшифровать может только получатель с приватным ключом.
- В payload передаётся только ciphertext/nonce/mac + public key отправителя.

## Хранение данных
- Hive: профиль, друзья, чаты, сообщения.
- Flutter Secure Storage: приватный ключ.

## Функционал
- Telegram-подобный интерфейс (список чатов, чат-пузыри, нижняя навигация).
- Светлая и тёмная темы.
- Язык RU по умолчанию, переключение на EN.
- Добавление друзей через QR.
- Локальная история переписок.
