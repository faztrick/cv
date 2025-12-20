import 'package:get/get.dart';

class SessionService extends GetxService {
  final token = RxnString();
  final user = Rxn<Map<String, dynamic>>();

  bool get isAuthenticated => token.value != null && token.value!.isNotEmpty;

  void setAuth(
      {required String tokenValue, required Map<String, dynamic> userValue}) {
    token.value = tokenValue;
    user.value = userValue;
  }

  void clear() {
    token.value = null;
    user.value = null;
  }
}
