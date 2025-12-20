import 'package:get/get.dart';

import '../../../services/session_service.dart';

class HomeController extends GetxController {
  final session = Get.find<SessionService>();

  String? get email => session.user.value?['email']?.toString();
}
