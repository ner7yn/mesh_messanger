// src/screens/main/ChatsScreen.tsx
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatsStackParamList } from '@navigation/index';
import { useTheme } from '@hooks/useTheme';
import { useAppStore, Chat } from '@store/index';
import { useTranslation } from 'react-i18next';
import { useMesh } from '@hooks/useMesh';
import { formatTime } from '@utils/time';

type Nav = NativeStackNavigationProp<ChatsStackParamList, 'ChatList'>;

export function ChatsScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { t } = useTranslation();
  const { chats, friends, deleteChat, bleState, connectedDeviceName } = useAppStore();
  useMesh(); // Initialize mesh connection handling

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0)),
    [chats],
  );

  const openChat = useCallback(
    (chat: Chat) => {
      navigation.navigate('Chat', {
        friendId: chat.friendId,
        friendNickname: chat.friendNickname,
      });
    },
    [navigation],
  );

  const confirmDelete = useCallback(
    (chat: Chat) => {
      Alert.alert(t('chats.confirmDelete'), t('chats.confirmDeleteDesc'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteChat(chat.id),
        },
      ]);
    },
    [deleteChat],
  );

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      backgroundColor: theme.colors.header,
      paddingTop: 50,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.headerBorder,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      ...theme.typography.headlineMedium,
      color: theme.colors.headerText,
    },
    bleIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    bleDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    bleText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
    },
    divider: {
      height: 0.5,
      backgroundColor: theme.colors.divider,
      marginLeft: 76,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 20,
      color: '#fff',
      fontWeight: '600',
    },
    chatContent: { flex: 1, justifyContent: 'center' },
    chatTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    chatName: {
      ...theme.typography.titleSmall,
      color: theme.colors.textPrimary,
    },
    chatTime: {
      ...theme.typography.caption,
      color: theme.colors.textTertiary,
    },
    chatBottom: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lastMessage: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    unreadBadge: {
      backgroundColor: theme.colors.unread,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    unreadText: {
      ...theme.typography.captionSmall,
      color: '#fff',
      fontWeight: '700',
    },
    onlineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.online,
      position: 'absolute',
      bottom: 0,
      right: 10,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: {
      ...theme.typography.headlineSmall,
      color: theme.colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDesc: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
    encryptBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    encryptIcon: {
      ...theme.typography.caption,
      color: theme.colors.success,
    },
  });

  const getBleColor = () => {
    switch (bleState) {
      case 'connected': return theme.colors.bleConnected;
      case 'scanning':
      case 'connecting': return theme.colors.bleScanning;
      default: return theme.colors.bleDisconnected;
    }
  };

  const getBleLabel = () => {
    switch (bleState) {
      case 'connected': return connectedDeviceName ?? 'BLE';
      case 'scanning': return t('ble.scanning');
      case 'connecting': return t('ble.connecting');
      default: return t('ble.disconnected');
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      '#2AABEE', '#FF6B35', '#4CAF50', '#9C27B0',
      '#FF9800', '#E91E63', '#00BCD4', '#795548',
    ];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const friend = friends.find(f => f.id === item.friendId);
    const firstLetter = item.friendNickname.charAt(0).toUpperCase();
    const avatarColor = getAvatarColor(item.friendNickname);

    return (
      <TouchableOpacity
        onPress={() => openChat(item)}
        onLongPress={() => confirmDelete(item)}
        activeOpacity={0.7}
      >
        <View style={s.chatItem}>
          <View style={{ position: 'relative' }}>
            <View style={[s.avatar, { backgroundColor: avatarColor }]}>
              <Text style={s.avatarText}>{firstLetter}</Text>
            </View>
            {friend?.isOnline && <View style={s.onlineDot} />}
          </View>

          <View style={s.chatContent}>
            <View style={s.chatTop}>
              <Text style={s.chatName} numberOfLines={1}>
                {item.friendNickname}
              </Text>
              <Text style={s.chatTime}>
                {item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}
              </Text>
            </View>
            <View style={s.chatBottom}>
              <View style={s.encryptBadge}>
                <Text style={s.encryptIcon}>🔒</Text>
              </View>
              <Text style={s.lastMessage} numberOfLines={1}>
                {item.lastMessage ?? t('messages.emptyChatDesc')}
              </Text>
              {item.unreadCount > 0 && (
                <View style={s.unreadBadge}>
                  <Text style={s.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={s.divider} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.header}
      />
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>{t('chats.title')}</Text>
          <TouchableOpacity style={s.bleIndicator}>
            <View style={[s.bleDot, { backgroundColor: getBleColor() }]} />
            <Text style={s.bleText} numberOfLines={1}>
              {getBleLabel()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedChats}
        keyExtractor={item => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>💬</Text>
            <Text style={s.emptyTitle}>{t('chats.empty')}</Text>
            <Text style={s.emptyDesc}>{t('chats.emptyDesc')}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
