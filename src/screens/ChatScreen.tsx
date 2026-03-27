// src/screens/main/ChatScreen.tsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ChatsStackParamList } from '../navigation/index';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/index';
import { storageService, StoredMessage } from '../services/storage.service';
import { useMesh } from '../hooks/useMesh';
import { useTranslation } from 'react-i18next';
import { formatMessageTime, formatDateSeparator } from '../utils/time';

type RouteType = RouteProp<ChatsStackParamList, 'Chat'>;

export function ChatScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  const { friendId, friendNickname } = route.params;

  const { nodeId, friends, messages, markChatRead } = useAppStore();
  const { sendMessage } = useMesh();

  const friend = friends.find(f => f.id === friendId);
  const chatId = friendId;

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sendBtnScale = useRef(new Animated.Value(1)).current;

  // Load persisted messages on mount
  const [localMessages, setLocalMessages] = useState<StoredMessage[]>(() =>
    storageService.getMessages(chatId),
  );

  // Merge store messages with local
  const allMessages = useMemo(() => {
    const storeMessages = messages[chatId] ?? [];
    const merged = [...localMessages];
    for (const m of storeMessages) {
      if (!merged.find(lm => lm.id === m.id)) {
        merged.push(m);
      } else {
        const idx = merged.findIndex(lm => lm.id === m.id);
        merged[idx] = m; // update status
      }
    }
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [localMessages, messages[chatId]]);

  // Mark chat as read when opened
  useEffect(() => {
    markChatRead(chatId);
  }, [chatId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [allMessages.length]);

  // Update local messages when store changes
  useEffect(() => {
    const storeMessages = messages[chatId] ?? [];
    if (storeMessages.length > 0) {
      setLocalMessages(storageService.getMessages(chatId));
    }
  }, [messages[chatId]]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    if (!friend) {
      Alert.alert(t('common.error'), 'Friend not found');
      return;
    }

    // Animate send button
    Animated.sequence([
      Animated.timing(sendBtnScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(sendBtnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setText('');
    setIsSending(true);
    await sendMessage(friendId, trimmed);
    setIsSending(false);
  }, [text, isSending, friend, friendId, sendMessage]);

  const getStatusIcon = (status: StoredMessage['status']) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      case 'failed': return '⚠';
      default: return '';
    }
  };

  const getStatusColor = (status: StoredMessage['status']) => {
    if (status === 'read') return theme.colors.accent;
    if (status === 'failed') return theme.colors.error;
    return theme.colors.bubbleOutgoingText + '99';
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.backgroundSecondary },
    header: {
      backgroundColor: theme.colors.header,
      paddingTop: 50,
      paddingBottom: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.headerBorder,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backBtn: { padding: 8 },
    backText: { fontSize: 24, color: theme.colors.accent },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    avatarText: { fontSize: 16, color: '#fff', fontWeight: '600' },
    headerInfo: { flex: 1 },
    headerName: {
      ...theme.typography.titleMedium,
      color: theme.colors.headerText,
    },
    headerStatus: {
      ...theme.typography.caption,
      color: friend?.isOnline ? theme.colors.online : theme.colors.textTertiary,
    },
    encryptBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    encryptText: {
      ...theme.typography.captionSmall,
      color: theme.colors.success,
    },
    messageList: { flex: 1, paddingHorizontal: 8 },
    messageListContent: { paddingTop: 12, paddingBottom: 12 },

    // Date separator
    dateSeparator: {
      alignItems: 'center',
      marginVertical: 12,
    },
    dateSeparatorText: {
      ...theme.typography.captionSmall,
      color: theme.colors.textTertiary,
      backgroundColor: theme.colors.backgroundTertiary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },

    // Message bubble
    messageRow: {
      marginBottom: 4,
      flexDirection: 'row',
    },
    messageRowOutgoing: { justifyContent: 'flex-end' },
    messageRowIncoming: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '78%',
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6,
    },
    bubbleOutgoing: {
      backgroundColor: theme.colors.bubbleOutgoing,
      borderBottomRightRadius: 4,
    },
    bubbleIncoming: {
      backgroundColor: theme.colors.bubbleIncoming,
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      ...theme.typography.bodyMedium,
      lineHeight: 21,
    },
    bubbleTextOutgoing: { color: theme.colors.bubbleOutgoingText },
    bubbleTextIncoming: { color: theme.colors.bubbleIncomingText },
    bubbleMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 3,
    },
    bubbleTime: {
      fontSize: 11,
      opacity: 0.7,
    },
    bubbleTimeOutgoing: { color: theme.colors.bubbleOutgoingText },
    bubbleTimeIncoming: { color: theme.colors.bubbleIncomingText },
    statusIcon: { fontSize: 11 },

    // Decrypt error
    decryptError: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      fontStyle: 'italic',
    },

    // Input area
    inputArea: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 8,
      paddingVertical: 8,
      gap: 8,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 120,
      justifyContent: 'center',
    },
    input: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textPrimary,
      padding: 0,
      maxHeight: 100,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: theme.colors.backgroundTertiary,
    },
    sendIcon: { fontSize: 20 },
  });

  const getAvatarColor = (name: string) => {
    const colors = ['#2AABEE', '#FF6B35', '#4CAF50', '#9C27B0', '#FF9800'];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  };

  // Build list items with date separators
  const listItems = useMemo(() => {
    const items: Array<{ type: 'date'; date: string } | { type: 'message'; message: StoredMessage }> = [];
    let lastDate = '';
    for (const msg of allMessages) {
      const dateStr = formatDateSeparator(msg.timestamp);
      if (dateStr !== lastDate) {
        items.push({ type: 'date', date: dateStr });
        lastDate = dateStr;
      }
      items.push({ type: 'message', message: msg });
    }
    return items;
  }, [allMessages]);

  const renderItem = ({ item }: { item: typeof listItems[0] }) => {
    if (item.type === 'date') {
      return (
        <View style={s.dateSeparator}>
          <Text style={s.dateSeparatorText}>{item.date}</Text>
        </View>
      );
    }

    const msg = item.message;
    const isOutgoing = msg.senderId === nodeId;
    const isDecryptError = msg.text === '[Ошибка расшифровки]';

    return (
      <View style={[s.messageRow, isOutgoing ? s.messageRowOutgoing : s.messageRowIncoming]}>
        <View style={[s.bubble, isOutgoing ? s.bubbleOutgoing : s.bubbleIncoming]}>
          {isDecryptError ? (
            <Text style={s.decryptError}>🔒 {t('messages.decryptError')}</Text>
          ) : (
            <Text style={[s.bubbleText, isOutgoing ? s.bubbleTextOutgoing : s.bubbleTextIncoming]}>
              {msg.text}
            </Text>
          )}
          <View style={s.bubbleMeta}>
            <Text style={[s.bubbleTime, isOutgoing ? s.bubbleTimeOutgoing : s.bubbleTimeIncoming]}>
              {formatMessageTime(msg.timestamp)}
            </Text>
            {isOutgoing && (
              <Text style={[s.statusIcon, { color: getStatusColor(msg.status) }]}>
                {getStatusIcon(msg.status)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.header}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <View style={[s.avatar, { backgroundColor: getAvatarColor(friendNickname) }]}>
          <Text style={s.avatarText}>{friendNickname.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerName}>{friendNickname}</Text>
          <Text style={s.headerStatus}>
            {friend?.isOnline ? t('friends.online') : t('friends.offline')}
            {friend?.hops != null && friend.hops > 0 ? ` · ${friend.hops} hop` : ''}
          </Text>
        </View>
        <View style={s.encryptBadge}>
          <Text style={{ fontSize: 12 }}>🔒</Text>
          <Text style={s.encryptText}>E2E</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          style={s.messageList}
          contentContainerStyle={s.messageListContent}
          data={listItems}
          keyExtractor={(item, idx) =>
            item.type === 'date' ? `date-${idx}` : item.message.id
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>
              <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textTertiary, textAlign: 'center' }}>
                {t('messages.emptyChatDesc')}
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View style={s.inputArea}>
          <View style={s.inputWrapper}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder={t('messages.placeholder')}
              placeholderTextColor={theme.colors.textPlaceholder}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          </View>
          <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
            <TouchableOpacity
              style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || isSending}
              activeOpacity={0.8}
            >
              <Text style={s.sendIcon}>{isSending ? '⏳' : '➤'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
