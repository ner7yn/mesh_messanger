import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {ChatMessage, ChatThread, Friend, Locale, Profile, ThemeMode} from '../types/models';
import {loadChats, loadFriends, loadProfile, saveChats, saveFriends, saveProfile} from '../services/storageService';
import {createIdentityKeys, encryptForRecipient} from '../services/cryptoService';
import {v4 as uuidv4} from 'uuid';

type AppState = {
  profile: Profile | null;
  friends: Friend[];
  chats: ChatThread[];
  isHydrated: boolean;
  setupProfile: (nickname: string, controllerId: string) => Promise<void>;
  addFriendFromQr: (rawQr: string) => Promise<boolean>;
  sendMessage: (friendId: string, text: string) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLanguage: (language: Locale) => Promise<void>;
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({children}: {children: React.ReactNode}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedProfile, storedFriends, storedChats] = await Promise.all([
        loadProfile(),
        loadFriends(),
        loadChats()
      ]);

      setProfile(storedProfile);
      setFriends(storedFriends);
      setChats(storedChats);
      setHydrated(true);
    })();
  }, []);

  const setupProfile = async (nickname: string, controllerId: string) => {
    const keys = createIdentityKeys();
    const newProfile: Profile = {
      userId: uuidv4(),
      nickname,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      bleControllerId: controllerId,
      language: 'ru',
      theme: 'light'
    };
    setProfile(newProfile);
    await saveProfile(newProfile);
  };

  const addFriendFromQr = async (rawQr: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(rawQr) as Pick<Friend, 'id' | 'nickname' | 'publicKey'>;
      if (friends.some(friend => friend.id === parsed.id)) {
        return false;
      }

      const updated = [
        ...friends,
        {
          ...parsed,
          addedAt: new Date().toISOString()
        }
      ];
      setFriends(updated);
      await saveFriends(updated);
      return true;
    } catch {
      return false;
    }
  };

  const sendMessage = async (friendId: string, text: string) => {
    if (!profile) {
      return;
    }
    const friend = friends.find(item => item.id === friendId);
    if (!friend) {
      return;
    }

    const encryptedPayload = encryptForRecipient(
      text,
      profile.userId,
      profile.publicKey,
      profile.privateKey,
      friend.id,
      friend.publicKey
    );

    const message: ChatMessage = {
      id: encryptedPayload.id,
      chatId: friend.id,
      from: profile.userId,
      to: friend.id,
      text,
      createdAt: encryptedPayload.sentAt,
      outgoing: true
    };

    const thread = chats.find(item => item.friendId === friend.id);
    const updatedThread: ChatThread = thread
      ? {...thread, messages: [...thread.messages, message]}
      : {id: uuidv4(), friendId: friend.id, messages: [message]};

    const filtered = chats.filter(item => item.friendId !== friend.id);
    const updatedChats = [...filtered, updatedThread];

    setChats(updatedChats);
    await saveChats(updatedChats);
  };

  const setTheme = async (theme: ThemeMode) => {
    if (!profile) {
      return;
    }
    const updated = {...profile, theme};
    setProfile(updated);
    await saveProfile(updated);
  };

  const setLanguage = async (language: Locale) => {
    if (!profile) {
      return;
    }
    const updated = {...profile, language};
    setProfile(updated);
    await saveProfile(updated);
  };

  const value = useMemo(
    () => ({
      profile,
      friends,
      chats,
      isHydrated,
      setupProfile,
      addFriendFromQr,
      sendMessage,
      setTheme,
      setLanguage
    }),
    [profile, friends, chats, isHydrated]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
};
