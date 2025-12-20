import 'package:get/get.dart';

import '../../../data/repositories/cv_repository.dart';
import '../controllers/home_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<CvRepository>(() => const CvRepository());
    Get.lazyPut<HomeController>(() => HomeController(Get.find()));
  }
}
