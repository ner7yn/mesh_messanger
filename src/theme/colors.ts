// src/theme/colors.ts
export const LightColors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#E5E5EA',

  // Surfaces
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F2F7',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  textPlaceholder: '#C7C7CC',
  textInverse: '#FFFFFF',

  // Accent / Brand
  accent: '#2AABEE',          // Telegram-like blue
  accentDark: '#1E96D6',
  accentLight: '#E8F4FD',

  // Message bubbles
  bubbleOutgoing: '#2AABEE',
  bubbleIncoming: '#F2F2F7',
  bubbleOutgoingText: '#FFFFFF',
  bubbleIncomingText: '#000000',

  // Status
  online: '#4CAF50',
  offline: '#9E9E9E',
  away: '#FF9800',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',

  // UI Elements
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  divider: '#E5E5EA',
  icon: '#8E8E93',
  iconActive: '#2AABEE',

  // Navigation
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  tabBarActive: '#2AABEE',
  tabBarInactive: '#8E8E93',

  // Header
  header: '#FFFFFF',
  headerText: '#000000',
  headerBorder: '#E5E5EA',

  // BLE / Mesh specific
  bleConnected: '#4CAF50',
  bleScanning: '#FF9500',
  bleDisconnected: '#FF3B30',
  meshNode: '#2AABEE',
  meshNodeRelay: '#9C27B0',

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.1)',
  ripple: 'rgba(0,0,0,0.05)',
  unread: '#2AABEE',
  unreadBadge: '#FF3B30',
} as const;

export const DarkColors = {
  // Backgrounds
  background: '#17212B',
  backgroundSecondary: '#0E1621',
  backgroundTertiary: '#1C2733',

  // Surfaces
  surface: '#242F3D',
  surfaceSecondary: '#1C2733',
  surfaceElevated: '#2B3A4A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textTertiary: '#6B7D8E',
  textPlaceholder: '#4A5568',
  textInverse: '#000000',

  // Accent / Brand
  accent: '#2AABEE',
  accentDark: '#1E96D6',
  accentLight: '#1A3A52',

  // Message bubbles
  bubbleOutgoing: '#2B5278',
  bubbleIncoming: '#182533',
  bubbleOutgoingText: '#FFFFFF',
  bubbleIncomingText: '#FFFFFF',

  // Status
  online: '#4CAF50',
  offline: '#6B7D8E',
  away: '#FF9800',
  error: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',

  // UI Elements
  border: '#2B3A4A',
  borderLight: '#1C2733',
  divider: '#2B3A4A',
  icon: '#6B7D8E',
  iconActive: '#2AABEE',

  // Navigation
  tabBar: '#17212B',
  tabBarBorder: '#2B3A4A',
  tabBarActive: '#2AABEE',
  tabBarInactive: '#6B7D8E',

  // Header
  header: '#17212B',
  headerText: '#FFFFFF',
  headerBorder: '#2B3A4A',

  // BLE / Mesh specific
  bleConnected: '#4CAF50',
  bleScanning: '#FF9F0A',
  bleDisconnected: '#FF453A',
  meshNode: '#2AABEE',
  meshNodeRelay: '#BB86FC',

  // Misc
  overlay: 'rgba(0,0,0,0.7)',
  shadow: 'rgba(0,0,0,0.4)',
  ripple: 'rgba(255,255,255,0.05)',
  unread: '#2AABEE',
  unreadBadge: '#FF453A',
} as const;

export type ColorScheme = typeof LightColors;
