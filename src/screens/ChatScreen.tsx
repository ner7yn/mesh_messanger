import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {Screen} from '../components/Screen';
import {useApp} from '../store/AppContext';
import {getPalette} from '../theme/useTheme';
import {t} from '../i18n/useI18n';
import {MessageBubble} from '../components/MessageBubble';

export const ChatScreen = ({route}: any) => {
  const {friendId} = route.params;
  const {friends, chats, sendMessage, profile} = useApp();
  const palette = getPalette(profile?.theme ?? 'light');
  const locale = profile?.language ?? 'ru';
  const [text, setText] = useState('');

  const friend = friends.find(item => item.id === friendId);
  const messages = useMemo(
    () => chats.find(item => item.friendId === friendId)?.messages ?? [],
    [chats, friendId]
  );

  const submit = async () => {
    if (!text.trim()) {
      return;
    }
    await sendMessage(friendId, text.trim());
    setText('');
  };

  return (
    <Screen backgroundColor={palette.bg}>
      <FlatList
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <MessageBubble
            message={item}
            incomingColor={palette.incomingBubble}
            outgoingColor={palette.outgoingBubble}
            textColor={palette.textPrimary}
          />
        )}
      />
      <View style={[styles.inputRow, {borderTopColor: palette.border, backgroundColor: palette.surface}]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={friend ? `${t(locale, 'messagePlaceholder')} ${friend.nickname}` : t(locale, 'messagePlaceholder')}
          placeholderTextColor={palette.textSecondary}
          style={[styles.input, {color: palette.textPrimary}]}
        />
        <TouchableOpacity style={[styles.sendButton, {backgroundColor: palette.primary}]} onPress={submit} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  messages: {
    padding: 12
  },
  inputRow: {
    borderTopWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20
  }
});
