import 'package:get/get.dart';

import '../../../services/api_client.dart';

class AdminController extends GetxController {
  final isLoading = false.obs;
  final creators = <Map<String, dynamic>>[].obs;
  final transactions = <Map<String, dynamic>>[].obs;
  final message = RxnString();

  late final ApiClient _api;

  Future<void> approveCreator(String id) async {
    await _performAction('/admin/creators/$id/approve');
  }

  Future<void> fetchCreators() async {
    isLoading.value = true;
    try {
      final res = await _api.getJson('/admin/creators');
      if (res['creators'] is List) {
        creators.value = List<Map<String, dynamic>>.from(res['creators']);
      }
    } catch (e) {
      message.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchTransactions() async {
    try {
      final res = await _api.getJson('/admin/transactions');
      if (res['entries'] is List) {
        transactions.value = List<Map<String, dynamic>>.from(res['entries']);
      }
    } catch (e) {
      print(e);
    }
  }

  @override
  void onInit() {
    super.onInit();
    _api = Get.find<ApiClient>();
    fetchCreators();
    fetchTransactions();
  }

  Future<void> rejectCreator(String id) async {
    await _performAction('/admin/creators/$id/reject');
  }

  Future<void> _performAction(String path) async {
    isLoading.value = true;
    try {
      await _api.postJson(path, {});
      await fetchCreators();
      Get.snackbar('Success', 'Action completed');
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }
}
