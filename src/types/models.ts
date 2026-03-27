export type ThemeMode = 'light' | 'dark';
export type Locale = 'ru' | 'en';

export type Profile = {
  userId: string;
  nickname: string;
  publicKey: string;
  privateKey: string;
  bleControllerId: string;
  language: Locale;
  theme: ThemeMode;
};

export type Friend = {
  id: string;
  nickname: string;
  publicKey: string;
  addedAt: string;
};

export type EncryptedPayload = {
  id: string;
  senderId: string;
  recipientId: string;
  senderPublicKey: string;
  nonce: string;
  cipherText: string;
  sentAt: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  from: string;
  to: string;
  text: string;
  createdAt: string;
  outgoing: boolean;
};

export type ChatThread = {
  id: string;
  friendId: string;
  messages: ChatMessage[];
};
