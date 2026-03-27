// src/screens/main/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index';

export function SettingsScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  const { theme: themeSetting, language, setTheme, setLanguage, resetApp } = useAppStore();

  const changeLanguage = (lang: 'ru' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const confirmReset = () => {
    Alert.alert(t('profile.logoutConfirm'), t('profile.logoutConfirmDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: resetApp,
      },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.backgroundSecondary },
    header: {
      backgroundColor: theme.colors.header,
      paddingTop: 50,
      paddingBottom: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.headerBorder,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backBtn: { padding: 8 },
    backText: { fontSize: 24, color: theme.colors.accent },
    headerTitle: {
      ...theme.typography.titleLarge,
      color: theme.colors.headerText,
      marginLeft: 8,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40, paddingTop: 16 },
    section: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
      borderRadius: 0,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
    },
    sectionTitle: {
      ...theme.typography.labelSmall,
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowIcon: { fontSize: 22, marginRight: 12 },
    rowLabel: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    rowValue: {
      ...theme.typography.bodySmall,
      color: theme.colors.textTertiary,
    },
    divider: {
      height: 0.5,
      backgroundColor: theme.colors.divider,
      marginLeft: 52,
    },
    // Theme options
    themeOptions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 8,
    },
    themeOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    themeOptionActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentLight,
    },
    themeOptionIcon: { fontSize: 18, marginBottom: 4 },
    themeOptionText: {
      ...theme.typography.labelSmall,
      color: theme.colors.textSecondary,
    },
    themeOptionTextActive: {
      color: theme.colors.accent,
      fontWeight: '600',
    },
    // Language options
    langOptions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 8,
    },
    langOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    langOptionActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentLight,
    },
    langFlag: { fontSize: 20 },
    langText: {
      ...theme.typography.labelMedium,
      color: theme.colors.textSecondary,
    },
    langTextActive: {
      color: theme.colors.accent,
      fontWeight: '600',
    },
    // Danger
    dangerBtn: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 0,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dangerText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.error,
    },
    versionText: {
      ...theme.typography.caption,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.header}
      />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('common.settings')}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* Theme */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('profile.theme')}</Text>
          </View>
          <View style={s.themeOptions}>
            {(['light', 'dark', 'system'] as const).map(opt => {
              const icons = { light: '☀️', dark: '🌙', system: '⚙️' };
              const labels = {
                light: t('profile.themeLight'),
                dark: t('profile.themeDark'),
                system: t('profile.themeSystem'),
              };
              return (
                <TouchableOpacity
                  key={opt}
                  style={[s.themeOption, themeSetting === opt && s.themeOptionActive]}
                  onPress={() => setTheme(opt)}
                >
                  <Text style={s.themeOptionIcon}>{icons[opt]}</Text>
                  <Text style={[s.themeOptionText, themeSetting === opt && s.themeOptionTextActive]}>
                    {labels[opt]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Language */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('profile.language')}</Text>
          </View>
          <View style={s.langOptions}>
            <TouchableOpacity
              style={[s.langOption, language === 'ru' && s.langOptionActive]}
              onPress={() => changeLanguage('ru')}
            >
              <Text style={s.langFlag}>🇷🇺</Text>
              <Text style={[s.langText, language === 'ru' && s.langTextActive]}>Русский</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.langOption, language === 'en' && s.langOptionActive]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={s.langFlag}>🇬🇧</Text>
              <Text style={[s.langText, language === 'en' && s.langTextActive]}>English</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('profile.about')}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowIcon}>📱</Text>
            <Text style={s.rowLabel}>MeshTalk</Text>
            <Text style={s.rowValue}>{t('profile.version', { version: '1.0.0' })}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowIcon}>🔒</Text>
            <Text style={s.rowLabel}>NaCl E2E Encryption</Text>
            <Text style={s.rowValue}>curve25519</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowIcon}>📡</Text>
            <Text style={s.rowLabel}>BLE + LoRa Mesh</Text>
            <Text style={s.rowValue}>react-native-ble-plx</Text>
          </View>
        </View>

        {/* Danger zone */}
        <View style={s.section}>
          <TouchableOpacity style={s.dangerBtn} onPress={confirmReset}>
            <Text style={s.rowIcon}>🗑️</Text>
            <Text style={s.dangerText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.versionText}>MeshTalk v1.0.0 • Меш-сеть через BLE/LoRa</Text>
      </ScrollView>
    </View>
  );
}
