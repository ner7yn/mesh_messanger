// src/screens/main/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  StatusBar,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@navigation/index';
import { useTheme } from '@hooks/useTheme';
import { useAppStore } from '@store/index';
import { useTranslation } from 'react-i18next';
import { getKeyFingerprint } from '@services/crypto.service';
import { bleService } from '@services/ble.service';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    nodeId, nickname, publicKey, bleState, connectedDeviceName,
    setNickname, setConnectedDevice, setBleState,
  } = useAppStore();

  const [editingNick, setEditingNick] = useState(false);
  const [tempNick, setTempNick] = useState(nickname);
  const fingerprint = publicKey ? getKeyFingerprint(publicKey) : '';

  const saveNickname = () => {
    const trimmed = tempNick.trim();
    if (trimmed.length < 2) {
      Alert.alert(t('common.error'), t('onboarding.nicknameTooShort'));
      return;
    }
    setNickname(trimmed);
    setEditingNick(false);
  };

  const copyKey = () => {
    Clipboard.setString(publicKey);
    Alert.alert('', t('profile.keyCopied'));
  };

  const disconnectDevice = async () => {
    await bleService.disconnect();
    setConnectedDevice(null, null);
    setBleState('disconnected');
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#2AABEE', '#FF6B35', '#4CAF50', '#9C27B0', '#FF9800'];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.backgroundSecondary },
    header: {
      backgroundColor: theme.colors.header,
      paddingTop: 50,
      paddingBottom: 16,
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
    settingsBtn: { padding: 4 },
    settingsIcon: { fontSize: 22, color: theme.colors.accent },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 32 },

    // Avatar area
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 28,
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
    nickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nickText: {
      ...theme.typography.headlineSmall,
      color: theme.colors.textPrimary,
    },
    nickInput: {
      ...theme.typography.headlineSmall,
      color: theme.colors.textPrimary,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.accent,
      minWidth: 120,
      textAlign: 'center',
      padding: 0,
    },
    editBtn: { padding: 6 },
    editIcon: { fontSize: 18, color: theme.colors.accent },
    saveBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    saveBtnText: { ...theme.typography.labelSmall, color: '#fff' },
    nodeIdText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textTertiary,
      marginTop: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    onlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      backgroundColor: theme.colors.success + '20',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success },
    onlineText: { ...theme.typography.labelSmall, color: theme.colors.success },

    // Sections
    section: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
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
    rowLabel: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    rowValue: {
      ...theme.typography.bodySmall,
      color: theme.colors.textTertiary,
      flex: 2,
      textAlign: 'right',
    },
    rowValueMono: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 11,
    },
    rowArrow: { ...theme.typography.bodyMedium, color: theme.colors.textTertiary, marginLeft: 8 },
    divider: { height: 0.5, backgroundColor: theme.colors.divider, marginLeft: 16 },
    bleDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    copyBtn: {
      backgroundColor: theme.colors.accentLight,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    copyBtnText: { ...theme.typography.labelSmall, color: theme.colors.accent },
  });

  const getBleColor = () => {
    switch (bleState) {
      case 'connected': return theme.colors.bleConnected;
      case 'scanning': case 'connecting': return theme.colors.bleScanning;
      default: return theme.colors.bleDisconnected;
    }
  };

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.header}
      />
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('profile.title')}</Text>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={s.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: getAvatarColor(nickname) }]}>
            <Text style={s.avatarText}>{nickname.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={s.nickRow}>
            {editingNick ? (
              <>
                <TextInput
                  style={s.nickInput}
                  value={tempNick}
                  onChangeText={setTempNick}
                  autoFocus
                  maxLength={32}
                  returnKeyType="done"
                  onSubmitEditing={saveNickname}
                />
                <TouchableOpacity style={s.saveBtn} onPress={saveNickname}>
                  <Text style={s.saveBtnText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.nickText}>{nickname}</Text>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => { setTempNick(nickname); setEditingNick(true); }}
                >
                  <Text style={s.editIcon}>✏️</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={s.nodeIdText}>{nodeId}</Text>

          {bleState === 'connected' && (
            <View style={s.onlineBadge}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>{connectedDeviceName ?? 'BLE Connected'}</Text>
            </View>
          )}
        </View>

        {/* Cryptography */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🔒 Шифрование</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>{t('profile.publicKey')}</Text>
            <Text style={[s.rowValue, s.rowValueMono]} numberOfLines={1}>
              {fingerprint}
            </Text>
            <TouchableOpacity style={s.copyBtn} onPress={copyKey}>
              <Text style={s.copyBtnText}>{t('profile.copyKey')}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Node ID</Text>
            <Text style={[s.rowValue, s.rowValueMono]}>{nodeId}</Text>
          </View>
        </View>

        {/* BLE Device */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📡 {t('profile.deviceInfo')}</Text>
          </View>
          <View style={s.row}>
            <View style={[s.bleDot, { backgroundColor: getBleColor() }]} />
            <Text style={s.rowLabel}>
              {bleState === 'connected'
                ? connectedDeviceName ?? t('ble.connected')
                : t('ble.disconnected')}
            </Text>
            {bleState === 'connected' ? (
              <TouchableOpacity onPress={disconnectDevice}>
                <Text style={{ ...theme.typography.bodySmall, color: theme.colors.error }}>
                  {t('profile.disconnect')}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textTertiary }}>
                {t('ble.disconnected')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import { Platform } from 'react-native';
