import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static ThemeData get dark => _baseTheme(_darkScheme);

  static ThemeData get light => _baseTheme(_lightScheme);

  static ColorScheme get _darkScheme => const ColorScheme.dark(
        primary: Color(0xFF818CF8),
        secondary: Color(0xFF67E8F9),
        surface: Color(0xFF0B1224),
      );
  static ColorScheme get _lightScheme => const ColorScheme.light(
        primary: Color(0xFF4F46E5),
        secondary: Color(0xFF22D3EE),
        surface: Color(0xFFF8FAFC),
      );

  static ThemeData _baseTheme(ColorScheme scheme) {
    final textTheme = GoogleFonts.manropeTextTheme();
    return ThemeData(
      colorScheme: scheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: scheme.surface,
      useMaterial3: true,
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 4,
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
        elevation: 0,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.surface.withValues(alpha: 0.8),
        selectedColor: scheme.primary.withValues(alpha: 0.12),
        labelStyle:
            textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
