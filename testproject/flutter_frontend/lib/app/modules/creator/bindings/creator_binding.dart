import 'package:get/get.dart';

import '../controllers/creator_controller.dart';

class CreatorBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<CreatorController>(CreatorController.new);
  }
}
