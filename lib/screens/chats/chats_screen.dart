import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/i18n/app_i18n.dart';
import '../../state/app_state.dart';

class ChatsScreen extends ConsumerStatefulWidget {
  const ChatsScreen({super.key});

  @override
  ConsumerState<ChatsScreen> createState() => _ChatsScreenState();
}

class _ChatsScreenState extends ConsumerState<ChatsScreen> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

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

  @override
  Widget build(BuildContext context) {
    final t = AppI18n.of(context);
    final state = ref.watch(appStateProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final query = _search.text.trim().toLowerCase();
    final filtered = state.chats.where((c) {
      if (query.isEmpty) return true;
      return c.friendNickname.toLowerCase().contains(query) ||
          c.lastMessage.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(t.t('chats'), style: const TextStyle(fontWeight: FontWeight.bold)),
        
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: TextField(
              controller: _search,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: t.t('search'),
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _search.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _search.clear();
                          setState(() {});
                        },
                      )
                    : null,
                filled: true,
                fillColor: isDark ? const Color(0xFF1C2733) : const Color(0xFFF2F2F7),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 64,
                          color: isDark ? const Color(0xFF4A5568) : const Color(0xFFCBD5E0),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          t.t('empty_chats'),
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                              ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => Divider(
                      indent: 76,
                      color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0),
                    ),
                    itemBuilder: (context, i) {
                      final c = filtered[i];
                      final lastTime = c.lastMessageAt > 0
                          ? DateFormat('HH:mm').format(DateTime.fromMillisecondsSinceEpoch(c.lastMessageAt))
                          : '';

                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        leading: CircleAvatar(
                          radius: 26,
                          backgroundColor: _avatarColor(c.friendNickname),
                          child: Text(
                            c.friendNickname.isNotEmpty ? c.friendNickname[0].toUpperCase() : '?',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                c.friendNickname,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                              ),
                            ),
                            Text(
                              lastTime,
                              style: TextStyle(
                                fontSize: 13,
                                color: c.unread > 0
                                    ? Theme.of(context).colorScheme.primary
                                    : Theme.of(context).textTheme.bodySmall?.color,
                              ),
                            ),
                          ],
                        ),
                        subtitle: Row(
                          children: [
                            Expanded(
                              child: Text(
                                c.lastMessage,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            if (c.unread > 0)
                              Container(
                                margin: const EdgeInsets.only(left: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).colorScheme.primary,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '${c.unread}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        onTap: () => context.push('/chat/${c.friendId}?name=${Uri.encodeComponent(c.friendNickname)}'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
