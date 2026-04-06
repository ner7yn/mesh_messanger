import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/i18n/app_i18n.dart';
import '../../models/friend.dart';
import '../../state/app_state.dart';

class FriendsScreen extends ConsumerStatefulWidget {
  const FriendsScreen({super.key});

  @override
  ConsumerState<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends ConsumerState<FriendsScreen> {
  bool showScanner = false;

  Color _avatarColor(String name) {
    final colors = [
      const Color(0xFF2AABEE),
      const Color(0xFF54C7EF),
      const Color(0xFF4CAF50),
      const Color(0xFFFF9800),
      const Color(0xFFE91E63),
      const Color(0xFF9C27B0),
      const Color(0xFF795548),
    ];
    int hash = 0;
    for (var c in name.codeUnits) hash = hash + c;
    return colors[hash % colors.length];
  }

  Future<void> _onQr(String raw) async {
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final friend = FriendModel(
        nodeId: map['id'] as String,
        nickname: map['nickname'] as String,
        publicKey: map['publicKey'] as String,
        addedAt: DateTime.now().millisecondsSinceEpoch,
      );

      await ref.read(appStateProvider.notifier).addFriend(friend);
      if (!mounted) return;
      setState(() => showScanner = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${friend.nickname} добавлен')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Неверный QR код')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppI18n.of(context);
    final state = ref.watch(appStateProvider);
    final me = state.profile;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final myQr = me == null
        ? '{}'
        : jsonEncode({'id': me.nodeId, 'nickname': me.nickname, 'publicKey': me.publicKey});

    return Scaffold(
      appBar: AppBar(
        // title: Text(t.t('friends'), style: const TextStyle(fontWeight: FontWeight.bold)),
        // actions: [
        //   IconButton(icon: const Icon(Icons.person_add_outlined), onPressed: () {}),
        // ],
      ),
      body: Column(
        children: [
          // My QR Card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF17212C) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  t.t('my_qr'),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: QrImageView(
                    data: myQr,
                    size: 160,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                    dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => setState(() => showScanner = !showScanner),
                      icon: const Icon(Icons.qr_code_scanner, size: 18),
                      label: Text(t.t('scan_qr')),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.primary,
                        side: BorderSide(color: Theme.of(context).colorScheme.primary),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Scanner
          if (showScanner)
            Container(
              height: 200,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).colorScheme.primary, width: 2),
              ),
              clipBehavior: Clip.hardEdge,
              child: MobileScanner(
                onDetect: (capture) {
                  final code = capture.barcodes.first.rawValue;
                  if (code != null) {
                    _onQr(code);
                  }
                },
              ),
            ),
          
          // Friends list header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                Text(
                  t.t('List_friend') + ' (${state.friends.length})',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                  ),
                ),
              ],
            ),
          ),
          
          // Friends list
          Expanded(
            child: state.friends.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.group_outlined,
                          size: 64,
                          color: isDark ? const Color(0xFF4A5568) : const Color(0xFFCBD5E0),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          t.t('empty_friends'),
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          t.t('add_friend_qr'),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: isDark ? const Color(0xFF4A5568) : const Color(0xFFA0AEC0),
                              ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: state.friends.length,
                    separatorBuilder: (_, __) => Divider(
                      indent: 76,
                      color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0),
                    ),
                    itemBuilder: (context, i) {
                      final f = state.friends[i];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        leading: CircleAvatar(
                          radius: 24,
                          backgroundColor: _avatarColor(f.nickname),
                          child: Text(
                            f.nickname.isNotEmpty ? f.nickname[0].toUpperCase() : '?',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        title: Text(
                          f.nickname,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                        ),
                        subtitle: Text(
                          f.nodeId,
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                            fontFamily: 'monospace',
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: f.online ? const Color(0xFF4CAF50) : const Color(0xFF8E8E93),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: Icon(
                                Icons.message_outlined,
                                color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                              ),
                              onPressed: () => context.push('/chat/${f.nodeId}?name=${Uri.encodeComponent(f.nickname)}'),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

