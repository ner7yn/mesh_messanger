# PROJECT_STRUCTURE

```text
mesh_messanger/
├─ App.tsx                        # Корневой провайдер + навигационный shell
├─ app.json                       # Имя RN-приложения
├─ index.js                       # Entry point React Native
├─ package.json                   # Скрипты и зависимости
├─ tsconfig.json                  # Конфигурация TypeScript
├─ README.md                      # Описание проекта и запуск
└─ src/
   ├─ components/
   │  ├─ MessageBubble.tsx        # Пузырь сообщения в стиле мессенджера
   │  └─ Screen.tsx               # Базовый безопасный контейнер экрана
   ├─ i18n/
   │  ├─ translations.ts          # RU/EN словари
   │  └─ useI18n.ts               # Вспомогательная функция t(locale,key)
   ├─ navigation/
   │  └─ AppNavigator.tsx         # Onboarding -> Tabs -> Chat stack
   ├─ screens/
   │  ├─ OnboardingScreen.tsx     # BLE подключение + ввод ника
   │  ├─ ChatsScreen.tsx          # Список чатов
   │  ├─ ChatScreen.tsx           # Диалог + отправка сообщений
   │  ├─ FriendsScreen.tsx        # QR-контакт, импорт друга, список друзей
   │  └─ SettingsScreen.tsx       # Переключение языка и темы
   ├─ services/
   │  ├─ bleService.ts            # Поиск/подключение LoRa BLE-девайса
   │  ├─ cryptoService.ts         # Генерация ключей, encrypt/decrypt
   │  └─ storageService.ts        # Persist профиля, друзей, чатов
   ├─ store/
   │  └─ AppContext.tsx           # Централизованное состояние приложения
   ├─ theme/
   │  ├─ palette.ts               # Цветовые палитры light/dark
   │  └─ useTheme.ts              # Выбор палитры по теме
   └─ types/
      └─ models.ts                # Доменные типы (Profile/Friend/Chat)
```

## Поток первого входа

1. `OnboardingScreen` запускает BLE-скан и подключает LoRa-контроллер.
2. После успешного соединения пользователь вводит ник.
3. Создаётся профиль с ключевой парой и сохраняется локально.

## Концепция друзей и сообщений

- Добавление друга: импорт JSON из QR (`id`, `nickname`, `publicKey`).
- Отправка сообщения: `encryptForRecipient(...)` -> ciphertext payload.
- Хранение: plaintext история в `AsyncStorage` (для UX), при реальном mesh-транспорте отправляется ciphertext.
