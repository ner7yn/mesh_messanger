// App.tsx
import 'react-native-get-random-values'; // Must be first import for crypto
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@navigation/index';
import { useAppStore } from '@store/index';
import { initI18n } from '@i18n/index';
import { storageService } from '@services/storage.service';
import { meshService } from '@services/mesh.service';
import FlashMessage from 'react-native-flash-message';

export default function App() {
  const { nodeId, nickname, publicKey, secretKey, initProfile } = useAppStore();

  useEffect(() => {
    // Init i18n with saved language (default: Russian)
    const lang = storageService.getLanguage();
    initI18n(lang);

    // Init profile (generate keys if needed)
    initProfile();
  }, []);

  // Re-init mesh service whenever profile changes
  useEffect(() => {
    if (nodeId && nickname && publicKey && secretKey) {
      meshService.init(nodeId, nickname, publicKey, secretKey);
    }
  }, [nodeId, nickname, publicKey, secretKey]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
        <FlashMessage position="top" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
