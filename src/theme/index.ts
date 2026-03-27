// src/theme/index.ts
import { LightColors, DarkColors, ColorScheme } from './colors';
import { TextStyle } from 'react-native';

export { LightColors, DarkColors };
export type { ColorScheme };

export const Typography = {
  // Display
  displayLarge: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 } as TextStyle,
  displayMedium: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 } as TextStyle,
  displaySmall: { fontSize: 24, fontWeight: '600', letterSpacing: -0.2 } as TextStyle,

  // Headline
  headlineLarge: { fontSize: 22, fontWeight: '600' } as TextStyle,
  headlineMedium: { fontSize: 20, fontWeight: '600' } as TextStyle,
  headlineSmall: { fontSize: 18, fontWeight: '600' } as TextStyle,

  // Title
  titleLarge: { fontSize: 17, fontWeight: '600' } as TextStyle,
  titleMedium: { fontSize: 16, fontWeight: '600' } as TextStyle,
  titleSmall: { fontSize: 15, fontWeight: '500' } as TextStyle,

  // Body
  bodyLarge: { fontSize: 17, fontWeight: '400' } as TextStyle,
  bodyMedium: { fontSize: 15, fontWeight: '400' } as TextStyle,
  bodySmall: { fontSize: 13, fontWeight: '400' } as TextStyle,

  // Label
  labelLarge: { fontSize: 15, fontWeight: '500' } as TextStyle,
  labelMedium: { fontSize: 13, fontWeight: '500' } as TextStyle,
  labelSmall: { fontSize: 11, fontWeight: '500' } as TextStyle,

  // Caption
  caption: { fontSize: 12, fontWeight: '400' } as TextStyle,
  captionSmall: { fontSize: 11, fontWeight: '400' } as TextStyle,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const Shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export interface AppTheme {
  colors: ColorScheme;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  isDark: boolean;
}

export const createTheme = (isDark: boolean): AppTheme => ({
  colors: (isDark ? DarkColors : LightColors) as ColorScheme,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  isDark,
});
