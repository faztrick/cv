import 'package:get/get.dart';

import '../../../services/api_client.dart';
import '../../../services/session_service.dart';

class AuthController extends GetxController {
  final email = ''.obs;
  final password = ''.obs;
  final isLoading = false.obs;
  final message = RxnString();

  late final ApiClient _api;
  late final SessionService _session;

  Future<void> login() async {
    isLoading.value = true;
    message.value = null;
    try {
      final res = await _api.postJson('/auth/login', {
        'email': email.value.trim(),
        'password': password.value,
      });
      final token = (res['token'] ?? '').toString();
      final user = (res['user'] is Map)
          ? Map<String, dynamic>.from(res['user'] as Map)
          : <String, dynamic>{};

      _session.setAuth(tokenValue: token, userValue: user);
      message.value = 'Logged in as ${user['email'] ?? 'user'}';
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onInit() {
    super.onInit();
    _api = Get.find<ApiClient>();
    _session = Get.find<SessionService>();
  }

  Future<void> register() async {
    isLoading.value = true;
    message.value = null;
    try {
      final res = await _api.postJson('/auth/register', {
        'email': email.value.trim(),
        'password': password.value,
        'role': 'FAN',
      });
      final token = (res['token'] ?? '').toString();
      final user = (res['user'] is Map)
          ? Map<String, dynamic>.from(res['user'] as Map)
          : <String, dynamic>{};

      _session.setAuth(tokenValue: token, userValue: user);
      message.value = 'Registered & logged in as ${user['email'] ?? 'user'}';
    } finally {
      isLoading.value = false;
    }
  }
}
