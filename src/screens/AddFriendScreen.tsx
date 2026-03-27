// src/screens/main/AddFriendScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FriendsStackParamList } from '@navigation/index';
import { useTheme } from '@hooks/useTheme';
import { useAppStore } from '@store/index';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { isValidPublicKey, getKeyFingerprint } from '@services/crypto.service';

// Note: RNCamera / Vision Camera required for actual QR scanning
// Using a mock interface here that shows the full integration structure
// In production: npm install react-native-vision-camera or react-native-camera

type RouteType = RouteProp<FriendsStackParamList, 'AddFriend'>;

interface FriendQRData {
  v: number;          // protocol version
  id: string;         // nodeId
  nick: string;       // nickname
  pk: string;         // public key (base64)
}

export function AddFriendScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const theme = useTheme();
  const { t } = useTranslation();
  const { nodeId, nickname, publicKey, addFriend, friends } = useAppStore();

  const [activeTab, setActiveTab] = useState<'my' | 'scan'>(
    route.params?.mode === 'scan' ? 'scan' : 'my',
  );
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // QR data for this user
  const myQRData: FriendQRData = {
    v: 1,
    id: nodeId,
    nick: nickname,
    pk: publicKey,
  };
  const myQRString = JSON.stringify(myQRData);

  const handleQRCodeScanned = useCallback(
    (data: string) => {
      setIsCameraActive(false);
      try {
        const parsed: FriendQRData = JSON.parse(data);

        if (!parsed.id || !parsed.nick || !parsed.pk) {
          Alert.alert(t('common.error'), t('errors.invalidQR'));
          return;
        }
        if (!isValidPublicKey(parsed.pk)) {
          Alert.alert(t('common.error'), t('errors.invalidQR'));
          return;
        }
        if (parsed.id === nodeId) {
          Alert.alert(t('common.error'), t('friends.cannotAddSelf'));
          return;
        }
        if (friends.find(f => f.id === parsed.id)) {
          Alert.alert(t('common.ok'), t('friends.alreadyFriend'));
          return;
        }

        // Add friend
        addFriend({
          id: parsed.id,
          nickname: parsed.nick,
          publicKey: parsed.pk,
          addedAt: Date.now(),
          isOnline: false,
          isNearby: false,
        });

        Alert.alert('✅', t('friends.addedSuccess', { name: parsed.nick }), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
      } catch {
        Alert.alert(t('common.error'), t('errors.invalidQR'));
      }
    },
    [nodeId, friends, addFriend, navigation],
  );

  // Simulate QR scan for demo (in production use actual camera)
  const simulateScan = () => {
    // This is a placeholder — in production, integrate react-native-vision-camera
    Alert.prompt(
      'Вставьте QR данные',
      'Введите JSON данные из QR-кода друга (для тестирования)',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'OK',
          onPress: (value) => {
            if (value) handleQRCodeScanned(value);
          },
        },
      ],
      'plain-text',
    );
  };

  const shareMyQR = () => {
    Share.share({
      message: `Добавь меня в MeshTalk!\nID: ${nodeId}\nНикнейм: ${nickname}\n\nДанные: ${myQRString}`,
      title: 'MeshTalk — добавить друга',
    });
  };

  const fingerprint = publicKey ? getKeyFingerprint(publicKey) : '';

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
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
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.backgroundSecondary,
      margin: 16,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 9,
    },
    tabActive: {
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    tabText: {
      ...theme.typography.labelMedium,
      color: theme.colors.textTertiary,
    },
    tabTextActive: {
      color: theme.colors.textPrimary,
    },
    content: { flex: 1 },
    scrollContent: { padding: 16, alignItems: 'center' },

    // My QR tab
    qrCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      ...theme.shadows.md,
      width: '100%',
      maxWidth: 320,
    },
    qrWrapper: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 16,
      marginBottom: 20,
    },
    userName: {
      ...theme.typography.headlineSmall,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    nodeIdText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textTertiary,
      marginBottom: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    fingerprintText: {
      ...theme.typography.captionSmall,
      color: theme.colors.textTertiary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginBottom: 16,
    },
    shareBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    shareBtnText: {
      ...theme.typography.titleSmall,
      color: '#fff',
    },
    hint: {
      ...theme.typography.bodySmall,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: 16,
      paddingHorizontal: 16,
    },

    // Scan tab
    scanArea: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: theme.colors.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    scanIcon: { fontSize: 64, marginBottom: 12 },
    scanPlaceholderText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    scanBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      width: '100%',
    },
    scanBtnText: {
      ...theme.typography.titleSmall,
      color: '#fff',
    },
    orText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textTertiary,
      marginVertical: 12,
    },
    manualBtn: {
      borderWidth: 1.5,
      borderColor: theme.colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      width: '100%',
    },
    manualBtnText: {
      ...theme.typography.titleSmall,
      color: theme.colors.accent,
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
        <Text style={s.headerTitle}>{t('friends.add')}</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'my' && s.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[s.tabText, activeTab === 'my' && s.tabTextActive]}>
            {t('friends.myQR')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'scan' && s.tabActive]}
          onPress={() => setActiveTab('scan')}
        >
          <Text style={[s.tabText, activeTab === 'scan' && s.tabTextActive]}>
            {t('friends.scanQR')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'my' ? (
          <>
            <View style={s.qrCard}>
              <View style={s.qrWrapper}>
                <QRCode
                  value={myQRString}
                  size={200}
                  color="#000000"
                  backgroundColor="#ffffff"
                  logo={{ uri: '' }}
                />
              </View>
              <Text style={s.userName}>{nickname}</Text>
              <Text style={s.nodeIdText}>{nodeId}</Text>
              <Text style={s.fingerprintText}>🔑 {fingerprint}</Text>
              <TouchableOpacity style={s.shareBtn} onPress={shareMyQR}>
                <Text style={s.shareBtnText}>📤 {t('common.share')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.hint}>{t('friends.shareHint')}</Text>
          </>
        ) : (
          <>
            <View style={s.scanArea}>
              <Text style={s.scanIcon}>📷</Text>
              <Text style={s.scanPlaceholderText}>{t('friends.scanHint')}</Text>
            </View>

            <TouchableOpacity style={s.scanBtn} onPress={simulateScan}>
              <Text style={s.scanBtnText}>📷 {t('friends.scanQR')}</Text>
            </TouchableOpacity>

            <Text style={s.orText}>— или —</Text>

            <TouchableOpacity style={s.manualBtn} onPress={simulateScan}>
              <Text style={s.manualBtnText}>Ввести данные вручную</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

import { Platform } from 'react-native';
