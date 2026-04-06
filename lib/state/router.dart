import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../screens/chats/chat_screen.dart';
import '../screens/chats/chats_screen.dart';
import '../screens/friends/friends_screen.dart';
import '../screens/home/home_shell.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/onboarding/onboarding_ble_required_screen.dart';
import '../screens/onboarding/onboarding_ble_screen.dart';
import '../screens/onboarding/onboarding_nickname_screen.dart';
import '../state/app_state.dart';
import '../services/ble_service.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final appState = ref.watch(appStateProvider);

  return GoRouter(
    initialLocation: appState.onboarded ? '/onboarding/ble-check' : '/onboarding/ble',
    routes: [
      GoRoute(path: '/onboarding/ble-check', builder: (_, __) => const OnboardingBleRequiredScreen()),
      GoRoute(path: '/onboarding/ble', builder: (_, __) => const OnboardingBleScreen()),
      GoRoute(path: '/onboarding/nickname', builder: (_, state) {
        final deviceId = state.uri.queryParameters['deviceId'] ?? '';
        return OnboardingNicknameScreen(deviceId: deviceId);
      }),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => HomeShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home/chats', builder: (_, __) => ChatsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/home/friends', builder: (_, __) => const FriendsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/home/settings', builder: (_, __) => const SettingsScreen()),
          ]),
        ],
      ),
      GoRoute(
        path: '/chat/:friendId',
        builder: (_, state) {
          final friendId = state.pathParameters['friendId']!;
          final name = state.uri.queryParameters['name'] ?? '';
          return ChatScreen(friendId: friendId, friendName: name);
        },
      ),
    ],
    redirect: (context, state) async {
      final path = state.fullPath ?? '';
      final onboarding = path.startsWith('/onboarding');
      
      // Если не onboarded - всегда на onboarding
      if (!appState.onboarded && path != '/onboarding/ble' && path != '/onboarding/ble-check') {
        return '/onboarding/ble-check';
      }
      
      // Если onboarded, проверяем Bluetooth
      if (appState.onboarded && !onboarding) {
        final ble = BleService.instance;
        
        // Проверяем актуальное состояние Bluetooth
        final isOn = await ble.checkBluetoothState();
        
        // Если Bluetooth выключен - показываем экран требования
        if (!isOn) {
          return '/onboarding/ble-check';
        }
        
        // Если Bluetooth включен но не подключен к устройству - на экран подключения
        if (!ble.isConnected) {
          return '/onboarding/ble';
        }
      }
      
      if (appState.onboarded && path == '/onboarding/ble') return '/home/chats';
      return null;
    },
  );
});
