import 'package:get/get.dart';

import '../../../data/models/cv_models.dart';
import '../../../data/repositories/cv_repository.dart';

class HomeController extends GetxController {
  HomeController(this._repository);

  final CvRepository _repository;

  final isLoading = true.obs;
  final errorMessage = RxnString();
  final cv = Rxn<CvData>();

  @override
  void onInit() {
    super.onInit();
    _load();
  }

  Future<void> _load() async {
    try {
      isLoading.value = true;
      cv.value = await _repository.loadCv();
    } catch (e) {
      errorMessage.value = 'Failed to load CV: $e';
    } finally {
      isLoading.value = false;
    }
  }

  List<String> get keywords => cv.value?.keywords.take(10).toList() ?? [];
}
