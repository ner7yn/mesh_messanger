import React from 'react';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {AppProvider, useApp} from './src/store/AppContext';
import {AppNavigator} from './src/navigation/AppNavigator';

const NavigationShell = () => {
  const {profile, isHydrated} = useApp();

  if (!isHydrated) {
    return null;
  }

  return (
    <NavigationContainer theme={profile?.theme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
};

const App = () => (
  <AppProvider>
    <NavigationShell />
  </AppProvider>
);

export default App;
