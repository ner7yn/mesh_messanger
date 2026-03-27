// src/services/storage.service.ts
// Persistent storage using react-native-mmkv (fast synchronous key-value store)

import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'meshtalk' });

export const StorageKeys = {
  // Onboarding / Profile
  IS_ONBOARDED: 'is_onboarded',
  NODE_ID: 'node_id',
  NICKNAME: 'nickname',
  PUBLIC_KEY: 'public_key',
  SECRET_KEY: 'secret_key',  // encrypted at rest (ideally use Keychain)

  // BLE
  CONNECTED_DEVICE_ID: 'connected_device_id',
  CONNECTED_DEVICE_NAME: 'connected_device_name',

  // Settings
  THEME: 'theme',               // 'light' | 'dark' | 'system'
  LANGUAGE: 'language',          // 'ru' | 'en'

  // Friends
  FRIENDS: 'friends',            // JSON array

  // Chats
  CHATS: 'chats',                // JSON array of chat metadata
  MESSAGES_PREFIX: 'msgs_',      // msgs_<chatId> = JSON array of messages
} as const;

class StorageService {
  // ─── Generic ───────────────────────────────────────────────────────────────

  getString(key: string): string | undefined {
    return storage.getString(key);
  }

  setString(key: string, value: string): void {
    storage.set(key, value);
  }

  getBool(key: string): boolean | undefined {
    return storage.getBoolean(key);
  }

  setBool(key: string, value: boolean): void {
    storage.set(key, value);
  }

  getJSON<T>(key: string): T | null {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setJSON<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  }

  delete(key: string): void {
    storage.remove(key);
  }

  clearAll(): void {
    storage.clearAll();
  }

  // ─── Profile ───────────────────────────────────────────────────────────────

  isOnboarded(): boolean {
    return storage.getBoolean(StorageKeys.IS_ONBOARDED) ?? false;
  }

  setOnboarded(value: boolean): void {
    storage.set(StorageKeys.IS_ONBOARDED, value);
  }

  getNickname(): string {
    return storage.getString(StorageKeys.NICKNAME) ?? '';
  }

  setNickname(nickname: string): void {
    storage.set(StorageKeys.NICKNAME, nickname);
  }

  getNodeId(): string {
    return storage.getString(StorageKeys.NODE_ID) ?? '';
  }

  setNodeId(nodeId: string): void {
    storage.set(StorageKeys.NODE_ID, nodeId);
  }

  getPublicKey(): string {
    return storage.getString(StorageKeys.PUBLIC_KEY) ?? '';
  }

  setPublicKey(key: string): void {
    storage.set(StorageKeys.PUBLIC_KEY, key);
  }

  getSecretKey(): string {
    return storage.getString(StorageKeys.SECRET_KEY) ?? '';
  }

  setSecretKey(key: string): void {
    // In production: use react-native-keychain for secret key storage
    storage.set(StorageKeys.SECRET_KEY, key);
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  getTheme(): 'light' | 'dark' | 'system' {
    return (storage.getString(StorageKeys.THEME) as any) ?? 'system';
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    storage.set(StorageKeys.THEME, theme);
  }

  getLanguage(): 'ru' | 'en' {
    return (storage.getString(StorageKeys.LANGUAGE) as any) ?? 'ru';
  }

  setLanguage(lang: 'ru' | 'en'): void {
    storage.set(StorageKeys.LANGUAGE, lang);
  }

  // ─── BLE ───────────────────────────────────────────────────────────────────

  getConnectedDeviceId(): string | undefined {
    return storage.getString(StorageKeys.CONNECTED_DEVICE_ID);
  }

  setConnectedDeviceId(id: string | null): void {
    if (id) {
      storage.set(StorageKeys.CONNECTED_DEVICE_ID, id);
    } else {
      storage.remove(StorageKeys.CONNECTED_DEVICE_ID);
    }
  }

  getConnectedDeviceName(): string | undefined {
    return storage.getString(StorageKeys.CONNECTED_DEVICE_NAME);
  }

  setConnectedDeviceName(name: string | null): void {
    if (name) {
      storage.set(StorageKeys.CONNECTED_DEVICE_NAME, name);
    } else {
      storage.remove(StorageKeys.CONNECTED_DEVICE_NAME);
    }
  }

  // ─── Messages ──────────────────────────────────────────────────────────────

  getMessages(chatId: string): StoredMessage[] {
    return this.getJSON<StoredMessage[]>(`${StorageKeys.MESSAGES_PREFIX}${chatId}`) ?? [];
  }

  saveMessage(chatId: string, message: StoredMessage): void {
    const messages = this.getMessages(chatId);
    const idx = messages.findIndex(m => m.id === message.id);
    if (idx >= 0) {
      messages[idx] = message;
    } else {
      messages.push(message);
    }
    // Keep last 500 messages per chat
    const trimmed = messages.slice(-500);
    this.setJSON(`${StorageKeys.MESSAGES_PREFIX}${chatId}`, trimmed);
  }

  updateMessageStatus(chatId: string, messageId: string, status: MessageStatus): void {
    const messages = this.getMessages(chatId);
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      messages[idx].status = status;
      this.setJSON(`${StorageKeys.MESSAGES_PREFIX}${chatId}`, messages);
    }
  }

  deleteMessages(chatId: string): void {
    storage.remove(`${StorageKeys.MESSAGES_PREFIX}${chatId}`);
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface StoredMessage {
  id: string;
  chatId: string;
  senderId: string;       // nodeId
  senderNickname: string;
  text: string;           // decrypted text (stored decrypted locally for speed)
  timestamp: number;
  status: MessageStatus;
  isOutgoing: boolean;
  packetId?: string;      // for ACK matching
}

export const storageService = new StorageService();
