import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChatThread, Friend, Profile} from '../types/models';

const KEY_PROFILE = 'mesh.profile';
const KEY_FRIENDS = 'mesh.friends';
const KEY_CHATS = 'mesh.chats';

export const saveProfile = (profile: Profile) =>
  AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(profile));

export const loadProfile = async (): Promise<Profile | null> => {
  const raw = await AsyncStorage.getItem(KEY_PROFILE);
  return raw ? (JSON.parse(raw) as Profile) : null;
};

export const saveFriends = (friends: Friend[]) =>
  AsyncStorage.setItem(KEY_FRIENDS, JSON.stringify(friends));

export const loadFriends = async (): Promise<Friend[]> => {
  const raw = await AsyncStorage.getItem(KEY_FRIENDS);
  return raw ? (JSON.parse(raw) as Friend[]) : [];
};

export const saveChats = (chats: ChatThread[]) =>
  AsyncStorage.setItem(KEY_CHATS, JSON.stringify(chats));

export const loadChats = async (): Promise<ChatThread[]> => {
  const raw = await AsyncStorage.getItem(KEY_CHATS);
  return raw ? (JSON.parse(raw) as ChatThread[]) : [];
};
