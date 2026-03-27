import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {Screen} from '../components/Screen';
import {useApp} from '../store/AppContext';
import {getPalette} from '../theme/useTheme';
import {t} from '../i18n/useI18n';

export const FriendsScreen = () => {
  const {profile, friends, addFriendFromQr} = useApp();
  const palette = getPalette(profile?.theme ?? 'light');
  const locale = profile?.language ?? 'ru';
  const [rawQr, setRawQr] = useState('');

  const myQr = useMemo(
    () =>
      JSON.stringify({
        id: profile?.userId,
        nickname: profile?.nickname,
        publicKey: profile?.publicKey
      }),
    [profile]
  );

  const addFriend = async () => {
    await addFriendFromQr(rawQr);
    setRawQr('');
  };

  return (
    <Screen backgroundColor={palette.bg}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <Text style={[styles.title, {color: palette.textPrimary}]}>{t(locale, 'myQr')}</Text>
            <QRCode value={myQr} size={160} />
            <Text style={[styles.title, {color: palette.textPrimary, marginTop: 24}]}>{t(locale, 'scanQr')}</Text>
            <TextInput
              style={[styles.input, {borderColor: palette.border, color: palette.textPrimary}]}
              value={rawQr}
              onChangeText={setRawQr}
              placeholder='{"id":"...","nickname":"...","publicKey":"..."}'
              placeholderTextColor={palette.textSecondary}
            />
            <TouchableOpacity style={[styles.addButton, {backgroundColor: palette.primary}]} onPress={addFriend}>
              <Text style={styles.addButtonText}>{t(locale, 'addFriend')}</Text>
            </TouchableOpacity>
          </View>
        }
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={[styles.friendRow, {borderBottomColor: palette.border}]}> 
            <Text style={[styles.friendNick, {color: palette.textPrimary}]}>{item.nickname}</Text>
          </View>
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerBox: {
    padding: 16,
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    alignSelf: 'flex-start'
  },
  input: {
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48
  },
  addButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    alignItems: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  friendRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  friendNick: {
    fontSize: 18
  }
});
