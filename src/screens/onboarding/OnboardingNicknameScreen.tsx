// src/screens/onboarding/OnboardingNicknameScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@navigation/index';
import { useTheme } from '@hooks/useTheme';
import { useAppStore } from '@store/index';
import { meshService } from '@services/mesh.service';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingNickname'>;

export function OnboardingNicknameScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { t } = useTranslation();
  const { setNickname, completeOnboarding, nodeId, publicKey, secretKey } = useAppStore();

  const [nick, setNick] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const trimmed = nick.trim();
    if (!trimmed) {
      setError(t('onboarding.nicknameRequired'));
      shake();
      return false;
    }
    if (trimmed.length < 2) {
      setError(t('onboarding.nicknameTooShort'));
      shake();
      return false;
    }
    if (trimmed.length > 32) {
      setError(t('onboarding.nicknameTooLong'));
      shake();
      return false;
    }
    return true;
  };

  const finish = () => {
    if (!validate()) return;
    const trimmed = nick.trim();
    setNickname(trimmed);
    completeOnboarding();

    // Init mesh and announce
    meshService.init(nodeId, trimmed, publicKey, secretKey);
    setTimeout(() => meshService.sendHello(), 500);
  };

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      paddingBottom: 32,
      alignItems: 'center',
    },
    successBadge: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: theme.colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
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
    },
    body: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    inputContainer: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    inputWrapper: {
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: isFocused ? theme.colors.accent : 'transparent',
      paddingHorizontal: 16,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      ...theme.typography.bodyLarge,
      color: theme.colors.textPrimary,
      flex: 1,
      paddingVertical: 14,
    },
    charCount: {
      ...theme.typography.caption,
      color: theme.colors.textTertiary,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: 8,
      marginLeft: 4,
    },
    hint: {
      ...theme.typography.bodySmall,
      color: theme.colors.textTertiary,
      marginTop: 8,
      marginLeft: 4,
    },
    keyInfo: {
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      marginTop: 24,
      gap: 8,
    },
    keyInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    keyInfoLabel: {
      ...theme.typography.labelSmall,
      color: theme.colors.textTertiary,
      width: 70,
    },
    keyInfoValue: {
      ...theme.typography.captionSmall,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    finishBtn: {
      backgroundColor: theme.colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 32,
    },
    finishBtnText: {
      ...theme.typography.titleSmall,
      color: '#fff',
    },
    finishBtnDisabled: {
      opacity: 0.5,
    },
    encryptionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      justifyContent: 'center',
    },
    encryptionText: {
      ...theme.typography.caption,
      color: theme.colors.success,
    },
  });

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <KeyboardAvoidingView
        style={s.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.header}>
          <View style={s.successBadge}>
            <Text style={{ fontSize: 40 }}>✅</Text>
          </View>
          <View style={s.stepBadge}>
            <Text style={s.stepText}>{t('onboarding.step', { current: 2, total: 2 })}</Text>
          </View>
          <Text style={s.title}>{t('onboarding.enterNickname')}</Text>
          <Text style={s.subtitle}>{t('onboarding.nicknameHint')}</Text>
        </View>

        <View style={s.body}>
          <Animated.View
            style={[s.inputContainer, { transform: [{ translateX: shakeAnim }] }]}
          >
            <View style={s.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={s.input}
                value={nick}
                onChangeText={v => {
                  setNick(v);
                  setError('');
                }}
                placeholder={t('onboarding.nicknamePlaceholder')}
                placeholderTextColor={theme.colors.textPlaceholder}
                maxLength={32}
                autoFocus
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType="done"
                onSubmitEditing={finish}
              />
              <Text style={s.charCount}>{nick.length}/32</Text>
            </View>
          </Animated.View>

          {error ? (
            <Text style={s.errorText}>⚠ {error}</Text>
          ) : (
            <Text style={s.hint}>{t('onboarding.nicknameHint')}</Text>
          )}

          {/* Node info */}
          <View style={s.keyInfo}>
            <View style={s.keyInfoRow}>
              <Text style={s.keyInfoLabel}>Node ID</Text>
              <Text style={s.keyInfoValue}>{nodeId}</Text>
            </View>
            <View style={s.keyInfoRow}>
              <Text style={s.keyInfoLabel}>Public Key</Text>
              <Text style={s.keyInfoValue} numberOfLines={1}>
                {publicKey.slice(0, 32)}...
              </Text>
            </View>
          </View>

          <View style={s.encryptionBadge}>
            <Text style={{ fontSize: 14 }}>🔒</Text>
            <Text style={s.encryptionText}>E2E шифрование активно</Text>
          </View>

          <TouchableOpacity
            style={[s.finishBtn, !nick.trim() && s.finishBtnDisabled]}
            onPress={finish}
            activeOpacity={0.85}
          >
            <Text style={s.finishBtnText}>{t('onboarding.finish')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
