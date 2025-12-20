import 'package:get/get.dart';

import '../../../services/api_client.dart';

class FeedController extends GetxController {
  final isLoading = false.obs;
  final errorMessage = RxnString();

  late final ApiClient _api;

  final posts = <Map<String, dynamic>>[].obs;

  Future<void> fetchPosts() async {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      final res = await _api.getJson('/posts');
      final raw = res['posts'];
      if (raw is List) {
        posts.value = raw
            .map((e) => e is Map
                ? Map<String, dynamic>.from(e)
                : <String, dynamic>{'raw': e})
            .toList();
      } else {
        posts.clear();
      }
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onInit() {
    super.onInit();
    _api = Get.find<ApiClient>();
    fetchPosts();
  }

  Future<void> subscribe(String creatorId) async {
    isLoading.value = true;
    try {
      await _api.postJson('/billing/subscribe', {'creatorId': creatorId});
      await fetchPosts();
      Get.snackbar('Success', 'Subscribed!');
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> unlock(String postId) async {
    isLoading.value = true;
    try {
      await _api.postJson('/billing/unlock', {'postId': postId});
      await fetchPosts();
      Get.snackbar('Success', 'Unlocked!');
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }
}
