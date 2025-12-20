import 'package:get/get.dart';

import '../../../services/api_client.dart';

class CreatorController extends GetxController {
  final isLoading = false.obs;
  final message = RxnString();

  final creatorProfile = Rxn<Map<String, dynamic>>();
  final displayName = ''.obs;
  final bio = ''.obs;

  // Post creation
  final postTitle = ''.obs;
  final postBody = ''.obs;
  final postPriceType = 'SUBSCRIBER'.obs;
  final postPriceCents = 0.obs;

  late final ApiClient _api;

  Future<void> createPost() async {
    if (postTitle.value.trim().isEmpty || postBody.value.trim().isEmpty) {
      message.value = 'Title and Body are required';
      return;
    }

    isLoading.value = true;
    message.value = null;
    try {
      await _api.postJson('/posts', {
        'title': postTitle.value.trim(),
        'body': postBody.value.trim(),
        'priceType': postPriceType.value,
        'priceCents': postPriceCents.value,
      });

      message.value = 'Post created successfully!';
      postTitle.value = '';
      postBody.value = '';
      postPriceType.value = 'SUBSCRIBER';
      postPriceCents.value = 0;

      Get.back();
      Get.snackbar('Success', 'Post created!');
    } catch (e) {
      message.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchProfile() async {
    isLoading.value = true;
    try {
      final res = await _api.getJson('/creator/me');
      if (res['creator'] != null) {
        creatorProfile.value = Map<String, dynamic>.from(res['creator']);
      } else {
        creatorProfile.value = null;
      }
    } catch (e) {
      // Ignore errors for now (e.g. if not logged in)
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onInit() {
    super.onInit();
    _api = Get.find<ApiClient>();
    fetchProfile();
  }

  Future<void> submitForReview() async {
    if (displayName.value.trim().isEmpty) {
      message.value = 'Display name is required';
      return;
    }

    isLoading.value = true;
    message.value = null;
    try {
      final res = await _api.postJson('/creator/apply', {
        'displayName': displayName.value.trim(),
        'bio': bio.value.trim(),
      });

      if (res['creator'] != null) {
        creatorProfile.value = Map<String, dynamic>.from(res['creator']);
        message.value = 'Application submitted!';
      }
    } catch (e) {
      message.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }
}
