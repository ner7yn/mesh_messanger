import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../core/i18n/app_i18n.dart';
import '../../core/theme/app_theme.dart';
import '../../models/message.dart';
import '../../services/mesh_service.dart';
import '../../services/storage_service.dart';
import '../../state/app_state.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String friendId;
  final String friendName;

  const ChatScreen({super.key, required this.friendId, required this.friendName});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final _uuid = const Uuid();
  final _listController = ScrollController();
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    Future(() async {
      await ref.read(appStateProvider.notifier).markChatRead(widget.friendId);

      final state = ref.read(appStateProvider);
      final me = state.profile;
      if (me == null) return;

      final incoming = state.messages[widget.friendId]
              ?.where((m) => !m.isOutgoing && m.packetId != null)
              .toList() ??
          const <MessageModel>[];

      for (final m in incoming) {
        await MeshService.instance.sendRead(
          myNodeId: me.nodeId,
          toNodeId: widget.friendId,
          refPacketId: m.packetId!,
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _listController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  IconData _statusIcon(MessageStatus status) {
    switch (status) {
      case MessageStatus.sending:
        return Icons.schedule_rounded;
      case MessageStatus.sent:
        return Icons.check_rounded;
      case MessageStatus.delivered:
        return Icons.done_all_rounded;
      case MessageStatus.read:
        return Icons.done_all_rounded;
      case MessageStatus.failed:
        return Icons.error_outline_rounded;
    }
  }

  Color _statusColor(BuildContext context, MessageStatus status) {
    if (status == MessageStatus.read) return const Color(0xFF2AABEE);
    if (status == MessageStatus.failed) return Theme.of(context).colorScheme.error;
    return Theme.of(context).colorScheme.onSurface.withOpacity(0.5);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppI18n.of(context);
    final state = ref.watch(appStateProvider);
    final messages = state.messages[widget.friendId] ?? const <MessageModel>[];
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: Text(
                widget.friendName.isNotEmpty ? widget.friendName[0].toUpperCase() : '?',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.friendName,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    'был(а) недавно',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.call_outlined), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _listController,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              itemCount: messages.length,
              itemBuilder: (context, i) {
                final m = messages[i];
                final isOut = m.isOutgoing;
                final align = isOut ? Alignment.centerRight : Alignment.centerLeft;
                
                // Group by date separator
                final showDate = i == 0 || 
                    !_sameDay(
                      DateTime.fromMillisecondsSinceEpoch(messages[i-1].timestamp),
                      DateTime.fromMillisecondsSinceEpoch(m.timestamp),
                    );

                return Column(
                  children: [
                    if (showDate)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _formatDate(DateTime.fromMillisecondsSinceEpoch(m.timestamp)),
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                            ),
                          ),
                        ),
                      ),
                    Dismissible(
                      key: ValueKey(m.id),
                      direction: DismissDirection.startToEnd,
                      confirmDismiss: (_) async {
                        _controller.text = '@${widget.friendName} ';
                        _focusNode.requestFocus();
                        return false;
                      },
                      background: Container(
                        alignment: Alignment.centerLeft,
                        padding: const EdgeInsets.only(left: 20),
                        color: Colors.transparent,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.reply,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                      child: Align(
                        alignment: align,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isOut 
                                ? AppTheme.bubbleOutgoing(context)
                                : AppTheme.bubbleIncoming(context),
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(18),
                              topRight: const Radius.circular(18),
                              bottomLeft: Radius.circular(isOut ? 18 : 4),
                              bottomRight: Radius.circular(isOut ? 4 : 18),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 2,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          constraints: const BoxConstraints(maxWidth: 280),
                          child: Column(
                            crossAxisAlignment:
                                isOut ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                            children: [
                              Text(
                                m.text,
                                style: TextStyle(
                                  fontSize: 16,
                                  color: isOut 
                                      ? AppTheme.bubbleOutgoingText(context)
                                      : isDark ? Colors.white : Colors.black,
                                  height: 1.3,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    DateFormat('HH:mm').format(
                                      DateTime.fromMillisecondsSinceEpoch(m.timestamp),
                                    ),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isOut
                                          ? (isDark ? Colors.white70 : Colors.black54)
                                          : (isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93)),
                                    ),
                                  ),
                                  if (isOut) ...[
                                    const SizedBox(width: 4),
                                    Icon(
                                      _statusIcon(m.status),
                                      size: 14,
                                      color: _statusColor(context, m.status),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          // Input area
          Container(
            padding: EdgeInsets.fromLTRB(
              8,
              8,
              8,
              8 + MediaQuery.of(context).padding.bottom,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF17212C) : Colors.white,
              border: Border(
                top: BorderSide(
                  color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0),
                  width: 0.5,
                ),
              ),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.attach_file),
                  onPressed: () {},
                  color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                ),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    decoration: InputDecoration(
                      hintText: t.t('message_hint'),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1C2733) : const Color(0xFFF2F2F7),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    minLines: 1,
                    maxLines: 5,
                    textCapitalization: TextCapitalization.sentences,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.send_rounded, color: Colors.white),
                    onPressed: _send,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final date = DateTime(dt.year, dt.month, dt.day);

    if (date == today) return 'Сегодня';
    if (date == yesterday) return 'Вчера';
    return DateFormat('d MMMM yyyy').format(dt);
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    final state = ref.read(appStateProvider);
    final profile = state.profile;
    if (profile == null) return;

    final matches = state.friends.where((f) => f.nodeId == widget.friendId);
    if (matches.isEmpty) return;
    final friend = matches.first;
    final privateKey = await StorageService.getPrivateKey();
    if (privateKey == null) return;

    final packet = await MeshService.instance.createMessagePacket(
      myNodeId: profile.nodeId,
      myPublicKey: profile.publicKey,
      myPrivateKey: privateKey,
      friend: friend,
      plainText: text,
    );
    if (packet == null) return;

    final sendingMessage = MessageModel(
      id: _uuid.v4(),
      chatId: widget.friendId,
      senderId: profile.nodeId,
      text: text,
      timestamp: DateTime.now().millisecondsSinceEpoch,
      isOutgoing: true,
      status: MessageStatus.sending,
      packetId: packet.id,
    );

    await ref.read(appStateProvider.notifier).addMessage(
          widget.friendId,
          sendingMessage,
          friendNickname: widget.friendName,
        );

    final sent = await MeshService.instance.sendPacket(packet);
    await ref.read(appStateProvider.notifier).updateMessageStatusByPacketId(
          widget.friendId,
          packet.id,
          sent ? MessageStatus.sent : MessageStatus.failed,
        );

    _controller.clear();
    if (_listController.hasClients) {
      _listController.animateTo(
        _listController.position.maxScrollExtent + 80,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }
}

