import React, {useState} from 'react';
import {ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View} from 'react-native';
import {Screen} from '../components/Screen';
import {useApp} from '../store/AppContext';
import {scanAndConnectController} from '../services/bleService';
import {getPalette} from '../theme/useTheme';
import {t} from '../i18n/useI18n';

export const OnboardingScreen = () => {
  const {setupProfile} = useApp();
  const locale = 'ru';
  const palette = getPalette('light');
  const [isConnecting, setConnecting] = useState(false);
  const [controllerId, setControllerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');

  const connectController = async () => {
    try {
      setConnecting(true);
      const device = await scanAndConnectController();
      setControllerId(device.id);
    } catch {
      Alert.alert('BLE', 'Не удалось подключиться к LoRa BLE контроллеру');
    } finally {
      setConnecting(false);
    }
  };

  const complete = async () => {
    if (!controllerId || !nickname.trim()) {
      return;
    }
    await setupProfile(nickname.trim(), controllerId);
  };

  return (
    <Screen backgroundColor={palette.bg}>
      <View style={styles.container}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>{t(locale, 'setupTitle')}</Text>

        <Button
          title={controllerId ? t(locale, 'connected') : t(locale, 'connectBle')}
          onPress={connectController}
          color={palette.primary}
        />

        {isConnecting && <ActivityIndicator color={palette.primary} style={styles.loader} />}

        <TextInput
          style={[styles.input, {borderColor: palette.border, color: palette.textPrimary}]}
          value={nickname}
          placeholder={t(locale, 'enterNickname')}
          placeholderTextColor={palette.textSecondary}
          onChangeText={setNickname}
        />

        <Button title={t(locale, 'continue')} onPress={complete} color={palette.primary} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 18,
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  loader: {
    marginVertical: 6
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 16
  }
});
