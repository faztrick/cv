import 'package:ably_flutter/ably_flutter.dart' as ably;
import 'package:get/get.dart';

class RealtimeService extends GetxService {
  ably.Realtime? _client;

  // In a real app, this should be fetched from the backend or config
  // For this test project, we'll use a hardcoded key or environment variable if possible
  // We use const String.fromEnvironment to allow passing it via --dart-define
  final String _apiKey = const String.fromEnvironment('ABLY_API_KEY');

  void dispose() {
    _client?.close();
  }

  Future<RealtimeService> init() async {
    // If no key is provided, we can't connect
    if (_apiKey.isEmpty || _apiKey == 'YOUR_ABLY_API_KEY') {
      print('Ably API Key not set. Realtime features disabled.');
      return this;
    }

    try {
      final clientOptions = ably.ClientOptions(key: _apiKey);
      _client = ably.Realtime(options: clientOptions);

      _client?.connection.on().listen((stateChange) {
        print('Ably Connection State: ${stateChange.current}');
      });
    } catch (e) {
      print('Failed to initialize Ably: $e');
    }
    return this;
  }

  Stream<ably.Message>? subscribeToChannel(String channelName) {
    if (_client == null) return null;
    try {
      final channel = _client!.channels.get(channelName);
      return channel.subscribe();
    } catch (e) {
      print('Failed to subscribe to channel $channelName: $e');
      return null;
    }
  }
}
