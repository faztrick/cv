import 'package:get/get.dart';

import '../../../services/api_client.dart';
import '../../../services/realtime_service.dart';
import '../../../services/session_service.dart';

class NotificationsController extends GetxController {
  final isLoading = false.obs;
  final notifications = <Map<String, dynamic>>[].obs;

  late final ApiClient _api;
  late final RealtimeService _realtime;
  late final SessionService _session;

  Future<void> fetchNotifications() async {
    isLoading.value = true;
    try {
      final res = await _api.getJson('/notifications');
      if (res['notifications'] is List) {
        notifications.value =
            List<Map<String, dynamic>>.from(res['notifications']);
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to load notifications');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _api.postJson('/notifications/$id/read', {});
      // Update local state
      final index = notifications.indexWhere((n) => n['id'] == id);
      if (index != -1) {
        notifications[index] = {
          ...notifications[index],
          'readAt': DateTime.now().toIso8601String(),
        };
        notifications.refresh();
      }
    } catch (e) {
      print('Failed to mark as read: $e');
    }
  }

  @override
  void onInit() {
    super.onInit();
    _api = Get.find<ApiClient>();
    _realtime = Get.find<RealtimeService>();
    _session = Get.find<SessionService>();
    fetchNotifications();
    _subscribeToRealtime();
  }

  void _subscribeToRealtime() {
    final userId = _session.user.value?['id'];
    if (userId == null) return;

    // Subscribe to user-specific notifications
    final stream = _realtime.subscribeToChannel('notifications:$userId');
    stream?.listen((message) {
      print('New notification received: ${message.name}');
      fetchNotifications();

      Get.snackbar(
        'New Notification',
        'You have a new notification',
        snackPosition: SnackPosition.TOP,
        backgroundColor: Get.theme.colorScheme.surface,
        colorText: Get.theme.colorScheme.onSurface,
      );
    });
  }
}
