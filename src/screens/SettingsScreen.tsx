import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Screen} from '../components/Screen';
import {useApp} from '../store/AppContext';
import {getPalette} from '../theme/useTheme';
import {Locale, ThemeMode} from '../types/models';
import {t} from '../i18n/useI18n';

const optionPairs: {lang: Locale; label: string}[] = [
  {lang: 'ru', label: 'Русский'},
  {lang: 'en', label: 'English'}
];

const themePairs: {theme: ThemeMode; key: string}[] = [
  {theme: 'light', key: 'light'},
  {theme: 'dark', key: 'dark'}
];

export const SettingsScreen = () => {
  const {profile, setLanguage, setTheme} = useApp();
  const palette = getPalette(profile?.theme ?? 'light');
  const locale = profile?.language ?? 'ru';

  return (
    <Screen backgroundColor={palette.bg}>
      <View style={styles.block}>
        <Text style={[styles.header, {color: palette.textPrimary}]}>{t(locale, 'language')}</Text>
        {optionPairs.map(option => (
          <TouchableOpacity key={option.lang} onPress={() => setLanguage(option.lang)} style={styles.row}>
            <Text style={{color: palette.textPrimary}}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={[styles.header, {color: palette.textPrimary}]}>{t(locale, 'theme')}</Text>
        {themePairs.map(option => (
          <TouchableOpacity key={option.theme} onPress={() => setTheme(option.theme)} style={styles.row}>
            <Text style={{color: palette.textPrimary}}>{t(locale, option.key)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: 16,
    paddingTop: 18
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8
  },
  row: {
    paddingVertical: 12
  }
});
