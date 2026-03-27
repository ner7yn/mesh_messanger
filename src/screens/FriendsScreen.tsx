// src/screens/main/FriendsScreen.tsx
import React, { useCallback } from 'react';
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
import { FriendsStackParamList } from '@navigation/index';
import { useTheme } from '@hooks/useTheme';
import { useAppStore, Friend } from '@store/index';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@utils/time';

type Nav = NativeStackNavigationProp<FriendsStackParamList, 'FriendList'>;

export function FriendsScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { t } = useTranslation();
  const { friends, removeFriend, getOrCreateChat } = useAppStore();

  const openAddFriend = useCallback(() => {
    navigation.navigate('AddFriend', { mode: 'scan' });
  }, [navigation]);

  const confirmRemove = useCallback(
    (friend: Friend) => {
      Alert.alert(t('friends.confirmRemove'), t('friends.confirmRemoveDesc'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => removeFriend(friend.id),
        },
      ]);
    },
    [removeFriend],
  );

  const openChat = useCallback(
    (friend: Friend) => {
      const chat = getOrCreateChat(friend);
      // Navigate via Chats tab
      navigation.getParent()?.navigate('Chats', {
        screen: 'Chat',
        params: { friendId: friend.id, friendNickname: friend.nickname },
      });
    },
    [getOrCreateChat, navigation],
  );

  const getAvatarColor = (name: string) => {
    const colors = ['#2AABEE', '#FF6B35', '#4CAF50', '#9C27B0', '#FF9800', '#E91E63'];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      backgroundColor: theme.colors.header,
      paddingTop: 50,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.headerBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      ...theme.typography.headlineMedium,
      color: theme.colors.headerText,
    },
    addBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    addBtnText: {
      ...theme.typography.labelMedium,
      color: '#fff',
    },
    friendItem: {
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
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 20, color: '#fff', fontWeight: '600' },
    onlineDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      position: 'absolute',
      bottom: 0,
      right: 0,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    info: { flex: 1 },
    name: {
      ...theme.typography.titleSmall,
      color: theme.colors.textPrimary,
      marginBottom: 3,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusText: {
      ...theme.typography.bodySmall,
    },
    nodeId: {
      ...theme.typography.caption,
      color: theme.colors.textTertiary,
    },
    signalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    signalText: {
      ...theme.typography.captionSmall,
      color: theme.colors.textTertiary,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    msgBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    msgBtnText: {
      ...theme.typography.labelSmall,
      color: '#fff',
    },
    moreBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreBtnText: {
      ...theme.typography.titleSmall,
      color: theme.colors.textTertiary,
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
    },
    emptyDesc: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyAddBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 14,
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    emptyAddBtnText: {
      ...theme.typography.titleSmall,
      color: '#fff',
    },
    nearbySection: {
      ...theme.typography.labelSmall,
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
      backgroundColor: theme.colors.backgroundSecondary,
    },
  });

  const onlineFriends = friends.filter(f => f.isOnline);
  const offlineFriends = friends.filter(f => !f.isOnline);

  const renderFriend = ({ item }: { item: Friend }) => {
    const color = getAvatarColor(item.nickname);
    return (
      <TouchableOpacity
        onLongPress={() => confirmRemove(item)}
        activeOpacity={0.8}
      >
        <View style={s.friendItem}>
          <View style={s.avatarContainer}>
            <View style={[s.avatar, { backgroundColor: color }]}>
              <Text style={s.avatarText}>{item.nickname.charAt(0).toUpperCase()}</Text>
            </View>
            <View
              style={[
                s.onlineDot,
                { backgroundColor: item.isOnline ? theme.colors.online : theme.colors.offline },
              ]}
            />
          </View>

          <View style={s.info}>
            <Text style={s.name}>{item.nickname}</Text>
            <View style={s.statusRow}>
              <Text
                style={[
                  s.statusText,
                  { color: item.isOnline ? theme.colors.online : theme.colors.textTertiary },
                ]}
              >
                {item.isOnline ? t('friends.online') : (
                  item.lastSeen
                    ? t('friends.lastSeen', { time: formatRelativeTime(item.lastSeen) })
                    : t('friends.offline')
                )}
              </Text>
              {item.hops != null && item.hops > 0 && (
                <Text style={s.signalText}>· {item.hops} hop</Text>
              )}
              {item.isNearby && (
                <View style={{
                  backgroundColor: theme.colors.success + '20',
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}>
                  <Text style={{ ...theme.typography.captionSmall, color: theme.colors.success }}>
                    {t('friends.nearby')}
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.nodeId}>{item.id}</Text>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.msgBtn} onPress={() => openChat(item)}>
              <Text style={s.msgBtnText}>{t('friends.sendMessage')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.divider} />
      </TouchableOpacity>
    );
  };

  const allSorted = [
    ...onlineFriends.sort((a, b) => a.nickname.localeCompare(b.nickname)),
    ...offlineFriends.sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0)),
  ];

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.header}
      />
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('friends.title')}</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAddFriend}>
          <Text style={s.addBtnText}>+ {t('friends.add')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={allSorted}
        keyExtractor={item => item.id}
        renderItem={renderFriend}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyTitle}>{t('friends.empty')}</Text>
            <Text style={s.emptyDesc}>{t('friends.emptyDesc')}</Text>
            <TouchableOpacity style={s.emptyAddBtn} onPress={openAddFriend}>
              <Text style={s.emptyAddBtnText}>+ {t('friends.add')}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
