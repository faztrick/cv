import 'package:get/get.dart';

import '../services/api_client.dart';
import '../services/realtime_service.dart';
import '../services/session_service.dart';

class AppBinding extends Bindings {
  @override
  void dependencies() {
    Get.put<SessionService>(SessionService(), permanent: true);
    Get.put<ApiClient>(ApiClient(session: Get.find<SessionService>()),
        permanent: true);
    Get.putAsync<RealtimeService>(() => RealtimeService().init(),
        permanent: true);
  }
}
