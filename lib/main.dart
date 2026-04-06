import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/i18n/app_i18n.dart';
import 'core/theme/app_theme.dart';
import 'services/storage_service.dart';
import 'state/app_state.dart';
import 'state/router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();

  runApp(const ProviderScope(child: MeshTalkApp()));
}

class MeshTalkApp extends ConsumerWidget {
  const MeshTalkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'MeshTalk',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: appState.themeMode,
      locale: Locale(appState.languageCode),
      supportedLocales: const [Locale('ru'), Locale('en')],
      localizationsDelegates: const [
        AppI18n.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
    );
  }
}
