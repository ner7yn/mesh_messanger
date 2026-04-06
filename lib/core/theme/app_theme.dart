import 'package:flutter/material.dart';

class AppTheme {
  // Telegram-like colors
  static const _telegramBlue = Color(0xFF2AABEE);
  static const _telegramGreen = Color(0xFF34C759);
  static const _telegramRed = Color(0xFFEF4444);

  // Light theme colors
  static const _lightBackground = Color(0xFFEFEBE9); // серо-розовый фон как в TG
  static const _lightSurface = Color(0xFFFFFFFF);
  static const _lightHeader = Color(0xFFFFFFFF);
  static const _lightDivider = Color(0xFFE0E0E0);
  static const _lightTextPrimary = Color(0xFF000000);
  static const _lightTextSecondary = Color(0xFF8E8E93);
  static const _lightBubbleOut = Color(0xFFEEFFDE); // светло-зеленый для исходящих
  static const _lightBubbleIn = Color(0xFFFFFFFF);

  // Dark theme colors
  static const _darkBackground = Color(0xFF0E1621);
  static const _darkSurface = Color(0xFF17212C);
  static const _darkHeader = Color(0xFF1A2430);
  static const _darkDivider = Color(0xFF2B3A4A);
  static const _darkTextPrimary = Color(0xFFFFFFFF);
  static const _darkTextSecondary = Color(0xFF8E8E93);
  static const _darkBubbleOut = Color(0xFF2B5278);
  static const _darkBubbleIn = Color(0xFF182533);

  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: _telegramBlue,
      scaffoldBackgroundColor: _lightBackground,
      colorScheme: const ColorScheme.light(
        primary: _telegramBlue,
        secondary: _telegramGreen,
        error: _telegramRed,
        surface: _lightSurface,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: _lightTextPrimary,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: _lightHeader,
        foregroundColor: _lightTextPrimary,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        titleTextStyle: TextStyle(
          color: _lightTextPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: _lightSurface,
        selectedItemColor: _telegramBlue,
        unselectedItemColor: _lightTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: _lightSurface,
        indicatorColor: _telegramBlue.withOpacity(0.15),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _telegramBlue);
          }
          return const TextStyle(fontSize: 12, color: _lightTextSecondary);
        }),
      ),
      cardTheme: CardThemeData(
        color: _lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _lightSurface,
        hintStyle: const TextStyle(color: _lightTextSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: const BorderSide(color: _telegramBlue, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      dividerTheme: const DividerThemeData(
        color: _lightDivider,
        thickness: 0.5,
        space: 0,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: _telegramBlue,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
      textTheme: const TextTheme(
        titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: _lightTextPrimary),
        titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _lightTextPrimary),
        bodyLarge: TextStyle(fontSize: 16, color: _lightTextPrimary),
        bodyMedium: TextStyle(fontSize: 14, color: _lightTextPrimary),
        bodySmall: TextStyle(fontSize: 13, color: _lightTextSecondary),
        labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _lightTextSecondary),
      ),
    );
  }

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: _telegramBlue,
      scaffoldBackgroundColor: _darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: _telegramBlue,
        secondary: _telegramGreen,
        error: _telegramRed,
        surface: _darkSurface,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: _darkTextPrimary,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: _darkHeader,
        foregroundColor: _darkTextPrimary,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        titleTextStyle: TextStyle(
          color: _darkTextPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: _darkHeader,
        selectedItemColor: _telegramBlue,
        unselectedItemColor: _darkTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: _darkHeader,
        indicatorColor: _telegramBlue.withOpacity(0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _telegramBlue);
          }
          return const TextStyle(fontSize: 12, color: _darkTextSecondary);
        }),
      ),
      cardTheme: CardThemeData(
        color: _darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _darkSurface,
        hintStyle: const TextStyle(color: _darkTextSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: const BorderSide(color: _telegramBlue, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      dividerTheme: const DividerThemeData(
        color: _darkDivider,
        thickness: 0.5,
        space: 0,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: _telegramBlue,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
      textTheme: const TextTheme(
        titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: _darkTextPrimary),
        titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _darkTextPrimary),
        bodyLarge: TextStyle(fontSize: 16, color: _darkTextPrimary),
        bodyMedium: TextStyle(fontSize: 14, color: _darkTextPrimary),
        bodySmall: TextStyle(fontSize: 13, color: _darkTextSecondary),
        labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _darkTextSecondary),
      ),
    );
  }

  // Bubble colors for chat
  static Color bubbleOutgoing(BuildContext context) {
    return Theme.of(context).brightness == Brightness.light
        ? const Color(0xFFEEFFDE)
        : const Color(0xFF2B5278);
  }

  static Color bubbleIncoming(BuildContext context) {
    return Theme.of(context).brightness == Brightness.light
        ? _lightSurface
        : const Color(0xFF182533);
  }

  static Color bubbleOutgoingText(BuildContext context) {
    return Theme.of(context).brightness == Brightness.light
        ? const Color(0xFF000000)
        : const Color(0xFFFFFFFF);
  }

  static Color bubbleIncomingText(BuildContext context) {
    return Theme.of(context).brightness == Brightness.light
        ? const Color(0xFF000000)
        : const Color(0xFFFFFFFF);
  }
}
