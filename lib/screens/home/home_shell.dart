 import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n/app_i18n.dart';
import '../../state/app_state.dart';

class HomeShell extends ConsumerStatefulWidget {
  final StatefulNavigationShell shell;

  const HomeShell({super.key, required this.shell});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // При возвращении в приложение проверяем Bluetooth
    if (state == AppLifecycleState.resumed) {
      ref.read(appStateProvider.notifier).refreshBleStatus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppI18n.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: widget.shell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0),
              width: 0.5,
            ),
          ),
        ),
        child: NavigationBar(
          selectedIndex: widget.shell.currentIndex,
          onDestinationSelected: (index) {
            widget.shell.goBranch(
              index,
              initialLocation: index == widget.shell.currentIndex,
            );
          },
          height: 60,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            NavigationDestination(
              icon: Icon(
                Icons.chat_bubble_outline,
                color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
              ),
              selectedIcon: Icon(
                Icons.chat_bubble,
                color: Theme.of(context).colorScheme.primary,
              ),
              label: t.t('chats'),
            ),
            NavigationDestination(
              icon: Icon(
                Icons.group_outlined,
                color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
              ),
              selectedIcon: Icon(
                Icons.group,
                color: Theme.of(context).colorScheme.primary,
              ),
              label: t.t('friends'),
            ),
            NavigationDestination(
              icon: Icon(
                Icons.settings_outlined,
                color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
              ),
              selectedIcon: Icon(
                Icons.settings,
                color: Theme.of(context).colorScheme.primary,
              ),
              label: t.t('settings'),
            ),
          ],
        ),
      ),
    );
  }
}
