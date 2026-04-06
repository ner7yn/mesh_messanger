import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/chat.dart';
import '../models/friend.dart';
import '../models/message.dart';
import '../models/profile.dart';
import '../services/crypto_service.dart';
import '../services/storage_service.dart';
import '../services/mesh_service.dart';
import '../services/ble_service.dart';
import '../models/mesh_packet.dart';

class AppStateData {
  final bool onboarded;
  final String languageCode;
  final ThemeMode themeMode;
  final UserProfile? profile;
  final bool bleConnected;
  final String? connectedBleDeviceId;
  final List<FriendModel> friends;
  final List<ChatModel> chats;
  final Map<String, List<MessageModel>> messages;

  const AppStateData({
    required this.onboarded,
    required this.languageCode,
    required this.themeMode,
    required this.profile,
    required this.bleConnected,
    required this.connectedBleDeviceId,
    required this.friends,
    required this.chats,
    required this.messages,
  });

  AppStateData copyWith({
    bool? onboarded,
    String? languageCode,
    ThemeMode? themeMode,
    UserProfile? profile,
    bool? bleConnected,
    String? connectedBleDeviceId,
    List<FriendModel>? friends,
    List<ChatModel>? chats,
    Map<String, List<MessageModel>>? messages,
  }) =>
      AppStateData(
        onboarded: onboarded ?? this.onboarded,
        languageCode: languageCode ?? this.languageCode,
        themeMode: themeMode ?? this.themeMode,
        profile: profile ?? this.profile,
        bleConnected: bleConnected ?? this.bleConnected,
        connectedBleDeviceId: connectedBleDeviceId ?? this.connectedBleDeviceId,
        friends: friends ?? this.friends,
        chats: chats ?? this.chats,
        messages: messages ?? this.messages,
      );
}

class AppStateNotifier extends StateNotifier<AppStateData> {
  AppStateNotifier()
      : super(
          AppStateData(
            onboarded: StorageService.isOnboarded,
            languageCode: StorageService.languageCode,
            themeMode: StorageService.themeMode,
            profile: StorageService.profile,
            bleConnected: false,
            connectedBleDeviceId: null,
            friends: StorageService.getAllFriends(),
            chats: StorageService.getAllChats(),
            messages: {},
          ),
        ) {
    _startMeshListener();
    // Проверяем состояние Bluetooth при инициализации
    checkBleConnection();
  }

  Future<void> checkBleConnection() async {
    final ble = BleService.instance;
    final isOn = await ble.checkBluetoothState();
    final isConnected = ble.isConnected;
    
    // Обновляем состояние только если оно изменилось
    if (isOn && isConnected) {
      if (!state.bleConnected || state.connectedBleDeviceId != ble.connectedDeviceId) {
        state = state.copyWith(bleConnected: true, connectedBleDeviceId: ble.connectedDeviceId);
      }
    } else {
      if (state.bleConnected || state.connectedBleDeviceId != null) {
        state = state.copyWith(bleConnected: false, connectedBleDeviceId: null);
      }
    }
  }

  Future<void> refreshBleStatus() async {
    // Принудительно обновляем статус - вызываем из UI
    await checkBleConnection();
  }

  Future<void> completeOnboarding({required String nickname, required String bleDeviceId}) async {
    final kp = await CryptoService.generateKeyPair();
    final profile = UserProfile(
      nodeId: _generateNodeId(),
      nickname: nickname,
      publicKey: kp.publicKeyBase64,
    );

    await StorageService.savePrivateKey(kp.privateKeyBase64);
    await StorageService.saveProfile(profile);
    StorageService.isOnboarded = true;

    state = state.copyWith(
      onboarded: true,
      profile: profile,
      bleConnected: true,
      connectedBleDeviceId: bleDeviceId,
    );
  }

  void setBleConnected(bool value, {String? deviceId}) {
    state = state.copyWith(bleConnected: value, connectedBleDeviceId: deviceId);
  }

  Future<void> addFriend(FriendModel friend) async {
    if (state.friends.any((f) => f.nodeId == friend.nodeId)) return;
    await StorageService.upsertFriend(friend);
    state = state.copyWith(friends: [...state.friends, friend]);
  }

  Future<void> addMessage(String chatId, MessageModel message, {required String friendNickname}) async {
    final current = [...(state.messages[chatId] ?? <MessageModel>[])];
    current.add(message);

    final updatedMessages = {...state.messages, chatId: current};
    await StorageService.saveMessage(chatId, message);

    final idx = state.chats.indexWhere((c) => c.id == chatId);
    ChatModel chat;
    if (idx < 0) {
      chat = ChatModel(
        id: chatId,
        friendId: chatId,
        friendNickname: friendNickname,
        lastMessage: message.text,
        lastMessageAt: message.timestamp,
        unread: message.isOutgoing ? 0 : 1,
      );
      await StorageService.upsertChat(chat);
      state = state.copyWith(chats: [chat, ...state.chats], messages: updatedMessages);
    } else {
      final existing = state.chats[idx];
      chat = existing.copyWith(
        lastMessage: message.text,
        lastMessageAt: message.timestamp,
        unread: message.isOutgoing ? existing.unread : existing.unread + 1,
      );
      final copy = [...state.chats];
      copy[idx] = chat;
      copy.sort((a, b) => b.lastMessageAt.compareTo(a.lastMessageAt));
      await StorageService.upsertChat(chat);
      state = state.copyWith(chats: copy, messages: updatedMessages);
    }
  }

  Future<void> updateMessageStatusByPacketId(String chatId, String packetId, MessageStatus status) async {
    final list = [...(state.messages[chatId] ?? <MessageModel>[])];
    final idx = list.indexWhere((m) => m.packetId == packetId);
    if (idx < 0) return;
    final updated = list[idx].copyWith(status: status);
    list[idx] = updated;
    await StorageService.saveMessage(chatId, updated);
    state = state.copyWith(messages: {...state.messages, chatId: list});
  }

  Future<void> markChatRead(String chatId) async {
    final idx = state.chats.indexWhere((c) => c.id == chatId);
    if (idx < 0) return;
    final updated = [...state.chats];
    updated[idx] = updated[idx].copyWith(unread: 0);
    await StorageService.upsertChat(updated[idx]);
    state = state.copyWith(chats: updated);
  }

  void setThemeMode(ThemeMode mode) {
    StorageService.themeMode = mode;
    state = state.copyWith(themeMode: mode);
  }

  void setLanguage(String code) {
    StorageService.languageCode = code;
    state = state.copyWith(languageCode: code);
  }

  void _startMeshListener() {
    MeshService.instance.startListening((packet) async {
      final me = state.profile;
      if (me == null) return;
      if (packet.dst != me.nodeId && packet.dst != '*') return;

      if (packet.type == PacketType.ack && packet.refPacketId != null) {
        await updateMessageStatusByPacketId(packet.src, packet.refPacketId!, MessageStatus.delivered);
        return;
      }
      if (packet.type == PacketType.read && packet.refPacketId != null) {
        await updateMessageStatusByPacketId(packet.src, packet.refPacketId!, MessageStatus.read);
        return;
      }

      if (packet.type == PacketType.msg) {
        final privateKey = await StorageService.getPrivateKey();
        if (privateKey == null) return;

        final text = await MeshService.instance.decryptIncomingPayload(
          rawPayload: packet.payload,
          myPrivateKey: privateKey,
          myPublicKey: me.publicKey,
        );
        if (text == null) return;

        final friend = state.friends.firstWhere(
          (f) => f.nodeId == packet.src,
          orElse: () => FriendModel(
            nodeId: packet.src,
            nickname: packet.src,
            publicKey: '',
            addedAt: DateTime.now().millisecondsSinceEpoch,
          ),
        );

        final incoming = MessageModel(
          id: packet.id,
          chatId: packet.src,
          senderId: packet.src,
          text: text,
          timestamp: packet.ts,
          isOutgoing: false,
          status: MessageStatus.delivered,
          packetId: packet.id,
        );

        await addMessage(packet.src, incoming, friendNickname: friend.nickname);
        await MeshService.instance.sendAck(
          myNodeId: me.nodeId,
          toNodeId: packet.src,
          refPacketId: packet.id,
        );
      }
    });
  }

  String _generateNodeId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final rnd = Random.secure();
    return '!${List.generate(8, (_) => chars[rnd.nextInt(chars.length)]).join()}';
  }
}

final appStateProvider = StateNotifierProvider<AppStateNotifier, AppStateData>((ref) {
  return AppStateNotifier();
});
