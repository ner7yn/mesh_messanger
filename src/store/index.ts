// src/store/index.ts
import { create } from 'zustand';
import { storageService, StoredMessage } from '@services/storage.service';
import { generateKeyPair } from '@services/crypto.service';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Friend {
  id: string;            // nodeId
  nickname: string;
  publicKey: string;
  addedAt: number;
  lastSeen?: number;
  isOnline: boolean;
  rssi?: number;
  hops?: number;
  isNearby: boolean;
}

export interface Chat {
  id: string;            // typically == friend.id
  friendId: string;
  friendNickname: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
  isEncrypted: boolean;
}

export interface AppState {
  // Profile
  nodeId: string;
  nickname: string;
  publicKey: string;
  secretKey: string;
  isOnboarded: boolean;

  // BLE
  bleState: 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected' | 'error';
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;

  // Friends
  friends: Friend[];

  // Chats
  chats: Chat[];
  messages: Record<string, StoredMessage[]>; // chatId -> messages

  // Settings
  theme: 'light' | 'dark' | 'system';
  language: 'ru' | 'en';

  // Actions - Profile
  initProfile: () => void;
  setNickname: (nickname: string) => void;
  completeOnboarding: () => void;
  resetApp: () => void;

  // Actions - BLE
  setBleState: (state: AppState['bleState']) => void;
  setConnectedDevice: (id: string | null, name: string | null) => void;

  // Actions - Friends
  addFriend: (friend: Friend) => void;
  removeFriend: (nodeId: string) => void;
  updateFriendPresence: (nodeId: string, isOnline: boolean, rssi?: number, hops?: number) => void;

  // Actions - Chats & Messages
  addMessage: (chatId: string, message: StoredMessage) => void;
  updateMessageStatus: (chatId: string, messageId: string, status: StoredMessage['status']) => void;
  markChatRead: (chatId: string) => void;
  getOrCreateChat: (friend: Friend) => Chat;
  deleteChat: (chatId: string) => void;

  // Actions - Settings
  setTheme: (theme: AppState['theme']) => void;
  setLanguage: (language: AppState['language']) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Initial State ────────────────────────────────────────────────────────
  nodeId: storageService.getNodeId(),
  nickname: storageService.getNickname(),
  publicKey: storageService.getPublicKey(),
  secretKey: storageService.getSecretKey(),
  isOnboarded: storageService.isOnboarded(),
  bleState: 'idle',
  connectedDeviceId: storageService.getConnectedDeviceId() ?? null,
  connectedDeviceName: storageService.getConnectedDeviceName() ?? null,
  friends: storageService.getJSON<Friend[]>('friends') ?? [],
  chats: storageService.getJSON<Chat[]>('chats') ?? [],
  messages: {},
  theme: storageService.getTheme(),
  language: storageService.getLanguage(),

  // ─── Profile ──────────────────────────────────────────────────────────────
  initProfile: () => {
    let nodeId = storageService.getNodeId();
    let publicKey = storageService.getPublicKey();
    let secretKey = storageService.getSecretKey();

    // Generate new identity if none exists
    if (!nodeId || !publicKey) {
      const kp = generateKeyPair();
      nodeId = generateNodeId();
      publicKey = kp.publicKey;
      secretKey = kp.secretKey;

      storageService.setNodeId(nodeId);
      storageService.setPublicKey(publicKey);
      storageService.setSecretKey(secretKey);
    }

    set({ nodeId, publicKey, secretKey });
  },

  setNickname: (nickname) => {
    storageService.setNickname(nickname);
    set({ nickname });
  },

  completeOnboarding: () => {
    storageService.setOnboarded(true);
    set({ isOnboarded: true });
  },

  resetApp: () => {
    storageService.clearAll();
    set({
      nodeId: '',
      nickname: '',
      publicKey: '',
      secretKey: '',
      isOnboarded: false,
      bleState: 'idle',
      connectedDeviceId: null,
      connectedDeviceName: null,
      friends: [],
      chats: [],
      messages: {},
      theme: 'system',
      language: 'ru',
    });
  },

  // ─── BLE ──────────────────────────────────────────────────────────────────
  setBleState: (bleState) => set({ bleState }),

  setConnectedDevice: (id, name) => {
    storageService.setConnectedDeviceId(id);
    storageService.setConnectedDeviceName(name);
    set({ connectedDeviceId: id, connectedDeviceName: name });
  },

  // ─── Friends ──────────────────────────────────────────────────────────────
  addFriend: (friend) => {
    const friends = get().friends;
    if (friends.find(f => f.id === friend.id)) return;
    const updated = [...friends, friend];
    storageService.setJSON('friends', updated);
    set({ friends: updated });
  },

  removeFriend: (nodeId) => {
    const updated = get().friends.filter(f => f.id !== nodeId);
    storageService.setJSON('friends', updated);
    set({ friends: updated });
  },

  updateFriendPresence: (nodeId, isOnline, rssi, hops) => {
    const friends = get().friends.map(f =>
      f.id === nodeId
        ? {
            ...f,
            isOnline,
            rssi: rssi ?? f.rssi,
            hops: hops ?? f.hops,
            lastSeen: isOnline ? Date.now() : f.lastSeen,
            isNearby: (hops ?? 0) <= 1,
          }
        : f,
    );
    storageService.setJSON('friends', friends);
    set({ friends });
  },

  // ─── Chats & Messages ─────────────────────────────────────────────────────
  getOrCreateChat: (friend) => {
    const chats = get().chats;
    let chat = chats.find(c => c.friendId === friend.id);
    if (!chat) {
      chat = {
        id: friend.id,
        friendId: friend.id,
        friendNickname: friend.nickname,
        unreadCount: 0,
        isEncrypted: true,
      };
      const updated = [...chats, chat];
      storageService.setJSON('chats', updated);
      set({ chats: updated });
    }
    return chat;
  },

  addMessage: (chatId, message) => {
    // Update messages in memory
    const prev = get().messages[chatId] ?? [];
    const updated = [...prev, message];
    set(state => ({
      messages: { ...state.messages, [chatId]: updated },
    }));

    // Persist to storage
    storageService.saveMessage(chatId, message);

    // Update chat metadata
    const chats = get().chats.map(c =>
      c.id === chatId
        ? {
            ...c,
            lastMessage: message.text.slice(0, 60),
            lastMessageTime: message.timestamp,
            unreadCount: message.isOutgoing ? c.unreadCount : c.unreadCount + 1,
          }
        : c,
    );
    storageService.setJSON('chats', chats);
    set({ chats });
  },

  updateMessageStatus: (chatId, messageId, status) => {
    storageService.updateMessageStatus(chatId, messageId, status);
    set(state => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] ?? []).map(m =>
          m.id === messageId ? { ...m, status } : m,
        ),
      },
    }));
  },

  markChatRead: (chatId) => {
    const chats = get().chats.map(c =>
      c.id === chatId ? { ...c, unreadCount: 0 } : c,
    );
    storageService.setJSON('chats', chats);
    set({ chats });
  },

  deleteChat: (chatId) => {
    const chats = get().chats.filter(c => c.id !== chatId);
    storageService.setJSON('chats', chats);
    storageService.deleteMessages(chatId);
    set(state => {
      const { [chatId]: _, ...restMessages } = state.messages;
      return { chats, messages: restMessages };
    });
  },

  // ─── Settings ─────────────────────────────────────────────────────────────
  setTheme: (theme) => {
    storageService.setTheme(theme);
    set({ theme });
  },

  setLanguage: (language) => {
    storageService.setLanguage(language);
    set({ language });
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateNodeId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return '!' + Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}
