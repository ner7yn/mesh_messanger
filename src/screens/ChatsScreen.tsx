import React from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Screen} from '../components/Screen';
import {useApp} from '../store/AppContext';
import {getPalette} from '../theme/useTheme';
import {t} from '../i18n/useI18n';

export const ChatsScreen = ({navigation}: any) => {
  const {friends, chats, profile} = useApp();
  const palette = getPalette(profile?.theme ?? 'light');
  const locale = profile?.language ?? 'ru';

  return (
    <Screen backgroundColor={palette.bg}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: palette.textPrimary}]}>{t(locale, 'chats')}</Text>
      </View>
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const thread = chats.find(chat => chat.friendId === item.id);
          const lastMessage = thread?.messages.at(-1)?.text ?? '...';
          return (
            <TouchableOpacity
              style={[styles.item, {borderBottomColor: palette.border}]}
              onPress={() => navigation.navigate('Chat', {friendId: item.id})}>
              <Text style={[styles.nick, {color: palette.textPrimary}]}>{item.nickname}</Text>
              <Text style={[styles.preview, {color: palette.textSecondary}]}>{lastMessage}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700'
  },
  item: {
    padding: 16,
    borderBottomWidth: 1
  },
  nick: {
    fontSize: 18,
    fontWeight: '600'
  },
  preview: {
    marginTop: 4
  }
});
