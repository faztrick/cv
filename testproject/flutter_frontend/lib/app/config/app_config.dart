class AppConfig {
  /// Configure via: flutter run --dart-define=API_BASE_URL=http://localhost:4000
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000',
  );
}
