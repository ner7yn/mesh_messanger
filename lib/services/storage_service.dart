import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../models/chat.dart';
import '../models/friend.dart';
import '../models/message.dart';
import '../models/profile.dart';

class StorageService {
  static const _secure = FlutterSecureStorage();

  static const _boxApp = 'app';
  static const _boxFriends = 'friends';
  static const _boxChats = 'chats';
  static const _boxMessages = 'messages';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_boxApp);
    await Hive.openBox(_boxFriends);
    await Hive.openBox(_boxChats);
    await Hive.openBox(_boxMessages);
  }

  static Box get app => Hive.box(_boxApp);
  static Box get friends => Hive.box(_boxFriends);
  static Box get chats => Hive.box(_boxChats);
  static Box get messages => Hive.box(_boxMessages);

  static bool get isOnboarded => (app.get('isOnboarded') as bool?) ?? false;
  static set isOnboarded(bool v) => app.put('isOnboarded', v);

  static String get languageCode => (app.get('language') as String?) ?? 'ru';
  static set languageCode(String v) => app.put('language', v);

  static ThemeMode get themeMode {
    final raw = (app.get('themeMode') as String?) ?? 'system';
    switch (raw) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  static set themeMode(ThemeMode mode) => app.put('themeMode', mode.name);

  static Future<void> savePrivateKey(String key) => _secure.write(key: 'privateKey', value: key);
  static Future<String?> getPrivateKey() => _secure.read(key: 'privateKey');

  static UserProfile? get profile {
    final raw = app.get('profile');
    if (raw is Map) return UserProfile.fromJson(raw);
    return null;
  }

  static Future<void> saveProfile(UserProfile profile) => app.put('profile', profile.toJson());

  static List<FriendModel> getAllFriends() {
    return friends.values
        .whereType<Map>()
        .map(FriendModel.fromJson)
        .toList(growable: false);
  }

  static Future<void> upsertFriend(FriendModel friend) => friends.put(friend.nodeId, friend.toJson());

  static List<ChatModel> getAllChats() {
    return chats.values.whereType<Map>().map(ChatModel.fromJson).toList(growable: false)
      ..sort((a, b) => b.lastMessageAt.compareTo(a.lastMessageAt));
  }

  static Future<void> upsertChat(ChatModel chat) => chats.put(chat.id, chat.toJson());

  static List<MessageModel> getMessages(String chatId) {
    final raw = messages.get(chatId);
    if (raw is! List) return const [];
    return raw.whereType<Map>().map(MessageModel.fromJson).toList(growable: false)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }

  static Future<void> saveMessage(String chatId, MessageModel message) async {
    final list = getMessages(chatId).toList();
    final idx = list.indexWhere((m) => m.id == message.id);
    if (idx >= 0) {
      list[idx] = message;
    } else {
      list.add(message);
    }
    await messages.put(chatId, list.map((e) => e.toJson()).toList());
  }
}
