import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/i18n/app_i18n.dart';
import '../../state/app_state.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  @override
  void initState() {
    super.initState();
    // Обновляем статус Bluetooth при открытии экрана
    Future.microtask(() {
      ref.read(appStateProvider.notifier).refreshBleStatus();
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppI18n.of(context);
    final state = ref.watch(appStateProvider);
    final notifier = ref.read(appStateProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(t.t('settings'), style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          // Profile section
          if (state.profile != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF17212C) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: Text(
                      state.profile!.nickname.isNotEmpty 
                          ? state.profile!.nickname[0].toUpperCase() 
                          : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          state.profile!.nickname,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.qr_code),
                    onPressed: () => _showMyQrDialog(context, state),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // Theme section
          _SectionHeader(title: t.t('decor')),
          _SettingsCard(
            children: [
              _ThemeTile(
                title: t.t('theme'),
                subtitle: _themeLabel(state.themeMode, t),
                leading: Icon(
                  state.themeMode == ThemeMode.dark 
                      ? Icons.dark_mode 
                      : state.themeMode == ThemeMode.light 
                          ? Icons.light_mode 
                          : Icons.brightness_auto,
                ),
                onTap: () => _showThemePicker(context, notifier, state.themeMode, t),
              ),
              Divider(height: 1, indent: 56, color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0)),
              _ThemeTile(
                title: t.t('language'),
                subtitle: state.languageCode == 'ru' ? 'Русский' : 'English',
                leading: const Icon(Icons.language),
                onTap: () => _showLanguagePicker(context, notifier, state.languageCode),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // BLE section
          _SectionHeader(title: t.t('device')),
          _SettingsCard(
            children: [
              _ThemeTile(
                title: t.t('ble_connection'),
                subtitle: state.bleConnected ? t.t('connected') : t.t('not_connected'),
                leading: Icon(
                  state.bleConnected ? Icons.bluetooth_connected : Icons.bluetooth_disabled,
                  color: state.bleConnected ? const Color(0xFF4CAF50) : const Color(0xFF8E8E93),
                ),
                trailing: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: state.bleConnected ? const Color(0xFF4CAF50) : const Color(0xFFEF4444),
                    shape: BoxShape.circle,
                  ),
                ),
                onTap: () {
                  // Обновляем статус и показываем
                  notifier.refreshBleStatus();
                },
              ),
              if (state.connectedBleDeviceId != null) ...[
                Divider(height: 1, indent: 56, color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0)),
                _ThemeTile(
                  title: t.t('device'),
                  subtitle: state.connectedBleDeviceId!.substring(0, 17),
                  leading: const Icon(Icons.memory),
                  onTap: () {},
                ),
              ],
            ],
          ),

          const SizedBox(height: 16),

          // About section
          _SectionHeader(title: t.t('about')),
          _SettingsCard(
            children: [
              _ThemeTile(
                title: 'MeshTalk',
                subtitle: t.t('version') + ' 1.0.0',
                leading: const Icon(Icons.info_outline),
                onTap: () {},
              ),
              Divider(height: 1, indent: 56, color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0)),
              _ThemeTile(
                title: t.t('e2e_encryption'),
                subtitle: 'X25519 + ChaCha20-Poly1305',
                leading: const Icon(Icons.lock_outline),
                onTap: () {},
              ),
            ],
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _themeLabel(ThemeMode mode, AppI18n t) {
    switch (mode) {
      case ThemeMode.light:
        return t.t('light');
      case ThemeMode.dark:
        return t.t('dark');
      case ThemeMode.system:
        return t.t('system');
    }
  }

  void _showThemePicker(BuildContext context, AppStateNotifier notifier, ThemeMode current, AppI18n t) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.light_mode),
              title: Text(t.t('light')),
              trailing: current == ThemeMode.light ? const Icon(Icons.check, color: Color(0xFF2AABEE)) : null,
              onTap: () { notifier.setThemeMode(ThemeMode.light); Navigator.pop(ctx); },
            ),
            ListTile(
              leading: const Icon(Icons.dark_mode),
              title: Text(t.t('dark')),
              trailing: current == ThemeMode.dark ? const Icon(Icons.check, color: Color(0xFF2AABEE)) : null,
              onTap: () { notifier.setThemeMode(ThemeMode.dark); Navigator.pop(ctx); },
            ),
            ListTile(
              leading: const Icon(Icons.brightness_auto),
              title: Text(t.t('system')),
              trailing: current == ThemeMode.system ? const Icon(Icons.check, color: Color(0xFF2AABEE)) : null,
              onTap: () { notifier.setThemeMode(ThemeMode.system); Navigator.pop(ctx); },
            ),
          ],
        ),
      ),
    );
  }

  void _showLanguagePicker(BuildContext context, AppStateNotifier notifier, String current) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Text('🇷🇺', style: TextStyle(fontSize: 24)),
              title: const Text('Русский'),
              trailing: current == 'ru' ? const Icon(Icons.check, color: Color(0xFF2AABEE)) : null,
              onTap: () { notifier.setLanguage('ru'); Navigator.pop(ctx); },
            ),
            ListTile(
              leading: const Text('🇬🇧', style: TextStyle(fontSize: 24)),
              title: const Text('English'),
              trailing: current == 'en' ? const Icon(Icons.check, color: Color(0xFF2AABEE)) : null,
              onTap: () { notifier.setLanguage('en'); Navigator.pop(ctx); },
            ),
          ],
        ),
      ),
    );
  }

  void _showMyQrDialog(BuildContext context, AppStateData state) {
    if (state.profile == null || state.profile!.publicKey.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Профиль ещё не настроен')),
      );
      return;
    }
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final profile = state.profile!;
    final myQr = jsonEncode({
      'id': profile.nodeId,
      'nickname': profile.nickname,
      'publicKey': profile.publicKey,
    });

    showDialog(
      context: context,
      builder: (dialogContext) => Dialog(
        backgroundColor: isDark ? const Color(0xFF17212C) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: Theme.of(dialogContext).colorScheme.primary,
                    child: Text(
                      profile.nickname.isNotEmpty ? profile.nickname[0].toUpperCase() : '?',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      profile.nickname,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(dialogContext).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                width: 200,
                height: 200,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: QrImageView(
                  data: myQr,
                  version: QrVersions.auto,
                  size: 176,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Покажите этот QR код другу\nдля добавления в контакты',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).brightness == Brightness.dark 
              ? const Color(0xFF8E8E93) 
              : const Color(0xFF8E8E93),
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF17212C) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _ThemeTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget leading;
  final Widget? trailing;
  final VoidCallback onTap;

  const _ThemeTile({
    required this.title,
    required this.subtitle,
    required this.leading,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ListTile(
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: IconTheme(
          data: IconThemeData(
            color: Theme.of(context).colorScheme.primary,
            size: 20,
          ),
          child: leading,
        ),
      ),
      title: Text(title, style: const TextStyle(fontSize: 16)),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 13,
          color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
        ),
      ),
      trailing: trailing ?? Icon(
        Icons.chevron_right,
        color: isDark ? const Color(0xFF4A5568) : const Color(0xFFCBD5E0),
      ),
      onTap: onTap,
    );
  }
}
