// src/screens/onboarding/OnboardingDeviceScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/index';
import { useTheme } from '../../hooks/useTheme';
import { bleService, BLEDevice } from '../../services/ble.service';
import { useAppStore } from '../../store/index';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingDevice'>;

export function OnboardingDeviceScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { t } = useTranslation();
  const { initProfile, setBleState, setConnectedDevice } = useAppStore();

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initProfile();
    return () => {
      bleService.stopScan();
    };
  }, []);

  // Pulse animation for scanning indicator
  useEffect(() => {
    if (isScanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isScanning]);

  const startScan = useCallback(async () => {
    const hasPermission = await bleService.requestPermissions();
    if (!hasPermission) {
      Alert.alert(t('ble.permissionRequired'), t('ble.permissionDesc'));
      return;
    }

    const powered = await bleService.waitForPoweredOn();
    if (!powered) {
      Alert.alert(t('errors.bleDisabled'));
      return;
    }

    setDevices([]);
    setIsScanning(true);

    bleService.startScan(
      (device) => {
        setDevices(prev => {
          if (prev.find(d => d.id === device.id)) return prev;
          // Sort LoRa devices first
          const updated = [...prev, device].sort((a, b) =>
            (b.isLoRa ? 1 : 0) - (a.isLoRa ? 1 : 0),
          );
          return updated;
        });
      },
      15000,
    );

    setTimeout(() => setIsScanning(false), 15000);
  }, []);

  const connectDevice = useCallback(async (device: BLEDevice) => {
    setConnectingId(device.id);
    bleService.stopScan();
    setIsScanning(false);

    const success = await bleService.connect(device.id);

    if (success) {
      setConnectedDevice(device.id, device.name);
      setBleState('connected');
      navigation.navigate('OnboardingNickname');
    } else {
      Alert.alert(t('common.error'), t('errors.connectionLost'));
    }

    setConnectingId(null);
  }, []);

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      paddingBottom: 32,
      alignItems: 'center',
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    logoText: { fontSize: 40 },
    title: {
      ...theme.typography.headlineLarge,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    stepBadge: {
      backgroundColor: theme.colors.accentLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 16,
    },
    stepText: {
      ...theme.typography.labelSmall,
      color: theme.colors.accent,
    },
    body: {
      flex: 1,
      paddingHorizontal: 16,
    },
    scanBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      marginHorizontal: 8,
      marginBottom: 20,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    scanBtnText: {
      ...theme.typography.titleSmall,
      color: '#fff',
    },
    scanningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginBottom: 16,
      gap: 8,
    },
    scanningText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      ...theme.typography.labelMedium,
      color: theme.colors.textTertiary,
      paddingHorizontal: 8,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    deviceCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      marginBottom: 8,
      marginHorizontal: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    deviceIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    deviceName: {
      ...theme.typography.titleSmall,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    deviceMeta: {
      ...theme.typography.caption,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    loraBadge: {
      backgroundColor: theme.colors.accentLight,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    loraBadgeText: {
      ...theme.typography.captionSmall,
      color: theme.colors.accent,
      fontWeight: '600',
    },
    connectBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    connectBtnText: {
      ...theme.typography.labelMedium,
      color: '#fff',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
    rssiBar: {
      flexDirection: 'row',
      gap: 2,
      alignItems: 'flex-end',
    },
  });

  const getRSSIBars = (rssi: number | null) => {
    if (rssi === null) return 0;
    if (rssi > -60) return 4;
    if (rssi > -75) return 3;
    if (rssi > -85) return 2;
    return 1;
  };

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View style={s.header}>
        <View style={s.logo}>
          <Text style={s.logoText}>📡</Text>
        </View>
        <View style={s.stepBadge}>
          <Text style={s.stepText}>{t('onboarding.step', { current: 1, total: 2 })}</Text>
        </View>
        <Text style={s.title}>{t('onboarding.connectDevice')}</Text>
        <Text style={s.subtitle}>{t('onboarding.connectDeviceDesc')}</Text>
      </View>

      <View style={s.body}>
        <TouchableOpacity
          style={s.scanBtn}
          onPress={isScanning ? bleService.stopScan.bind(bleService) : startScan}
          activeOpacity={0.85}
        >
          {isScanning ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.scanBtnText}>{t('onboarding.scanning')}</Text>
            </>
          ) : (
            <Text style={s.scanBtnText}>
              {devices.length > 0 ? t('onboarding.retry') : t('onboarding.connectDevice')}
            </Text>
          )}
        </TouchableOpacity>

        {devices.length > 0 && (
          <Text style={s.sectionTitle}>
            {t('ble.device')} ({devices.length})
          </Text>
        )}

        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isConnecting = connectingId === item.id;
            const bars = getRSSIBars(item.rssi);
            return (
              <View style={s.deviceCard}>
                <View
                  style={[
                    s.deviceIcon,
                    { backgroundColor: item.isLoRa ? theme.colors.accentLight : theme.colors.backgroundSecondary },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{item.isLoRa ? '📡' : '🔵'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.deviceName}>{item.name ?? 'Unknown'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <Text style={s.deviceMeta}>{item.id.slice(0, 8)}...</Text>
                    {item.rssi && (
                      <Text style={[s.deviceMeta, { color: theme.colors.textTertiary }]}>
                        {item.rssi} dBm
                      </Text>
                    )}
                    {item.isLoRa && (
                      <View style={s.loraBadge}>
                        <Text style={s.loraBadgeText}>LoRa</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.connectBtn, isConnecting && { opacity: 0.7 }]}
                  onPress={() => connectDevice(item)}
                  disabled={isConnecting || connectingId !== null}
                >
                  {isConnecting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.connectBtnText}>{t('onboarding.connect')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            !isScanning ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
                <Text style={s.emptyText}>{t('onboarding.noDevices')}</Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}
