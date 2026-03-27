import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {ChatsScreen} from '../screens/ChatsScreen';
import {FriendsScreen} from '../screens/FriendsScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {useApp} from '../store/AppContext';
import {OnboardingScreen} from '../screens/OnboardingScreen';
import {t} from '../i18n/useI18n';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const RootTabs = () => {
  const {profile} = useApp();
  const locale = profile?.language ?? 'ru';

  return (
    <Tab.Navigator screenOptions={{headerShown: false}}>
      <Tab.Screen name='ChatsTab' component={ChatsScreen} options={{title: t(locale, 'chats')}} />
      <Tab.Screen name='FriendsTab' component={FriendsScreen} options={{title: t(locale, 'friends')}} />
      <Tab.Screen name='SettingsTab' component={SettingsScreen} options={{title: t(locale, 'settings')}} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const {profile} = useApp();

  if (!profile) {
    return <OnboardingScreen />;
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name='Main' component={RootTabs} options={{headerShown: false}} />
      <Stack.Screen name='Chat' component={ChatScreen} options={{title: 'Dialog'}} />
    </Stack.Navigator>
  );
};
