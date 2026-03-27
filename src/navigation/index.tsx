// src/navigation/index.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore } from '@store/index';
import { useTheme } from '@hooks/useTheme';

// Screens
import { OnboardingDeviceScreen } from '@screens/onboarding/OnboardingDeviceScreen';
import { OnboardingNicknameScreen } from '@screens/onboarding/OnboardingNicknameScreen';
import { ChatsScreen } from '@screens/main/ChatsScreen';
import { ChatScreen } from '@screens/main/ChatScreen';
import { FriendsScreen } from '@screens/main/FriendsScreen';
import { AddFriendScreen } from '@screens/main/AddFriendScreen';
import { ProfileScreen } from '@screens/main/ProfileScreen';
import { SettingsScreen } from '@screens/main/SettingsScreen';

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  OnboardingDevice: undefined;
  OnboardingNickname: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type ChatsStackParamList = {
  ChatList: undefined;
  Chat: { friendId: string; friendNickname: string };
};

export type FriendsStackParamList = {
  FriendList: undefined;
  AddFriend: { mode: 'scan' | 'show' };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ChatsStack = createNativeStackNavigator<ChatsStackParamList>();
const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="OnboardingDevice" component={OnboardingDeviceScreen} />
      <OnboardingStack.Screen name="OnboardingNickname" component={OnboardingNicknameScreen} />
    </OnboardingStack.Navigator>
  );
}

function ChatsNavigator() {
  const theme = useTheme();
  return (
    <ChatsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { ...theme.typography.titleLarge, color: theme.colors.headerText },
        headerShadowVisible: true,
      }}
    >
      <ChatsStack.Screen name="ChatList" component={ChatsScreen} options={{ title: '' }} />
      <ChatsStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.friendNickname })}
      />
    </ChatsStack.Navigator>
  );
}

function FriendsNavigator() {
  const theme = useTheme();
  return (
    <FriendsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { ...theme.typography.titleLarge, color: theme.colors.headerText },
      }}
    >
      <FriendsStack.Screen name="FriendList" component={FriendsScreen} options={{ title: '' }} />
      <FriendsStack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: '' }} />
    </FriendsStack.Navigator>
  );
}

function ProfileNavigator() {
  const theme = useTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { ...theme.typography.titleLarge, color: theme.colors.headerText },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: '' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: '' }} />
    </ProfileStack.Navigator>
  );
}

function MainNavigator() {
  const theme = useTheme();
  const chats = useAppStore(s => s.chats);
  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: { ...theme.typography.captionSmall },
      }}
    >
      <MainTab.Screen
        name="Chats"
        component={ChatsNavigator}
        options={{
          tabBarLabel: 'Чаты',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chat" color={color} size={size} badge={totalUnread} />
          ),
        }}
      />
      <MainTab.Screen
        name="Friends"
        component={FriendsNavigator}
        options={{
          tabBarLabel: 'Друзья',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="people" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

// Simple SVG-like tab icons using Unicode / emoji substitute
function TabIcon({
  name,
  color,
  size,
  badge,
}: {
  name: string;
  color: string;
  size: number;
  badge?: number;
}) {
  const icons: Record<string, string> = {
    chat: '💬',
    people: '👥',
    person: '👤',
  };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size - 2 }}>{icons[name] ?? '●'}</Text>
      {badge != null && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export function AppNavigator() {
  const isOnboarded = useAppStore(s => s.isOnboarded);
  const theme = useTheme();

  const navTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.header,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      primary: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
