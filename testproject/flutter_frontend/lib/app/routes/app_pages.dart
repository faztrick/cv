import 'package:get/get.dart';

import '../modules/admin/bindings/admin_binding.dart';
import '../modules/admin/views/admin_view.dart';
import '../modules/auth/bindings/auth_binding.dart';
import '../modules/auth/views/auth_view.dart';
import '../modules/creator/bindings/creator_binding.dart';
import '../modules/creator/views/create_post_view.dart';
import '../modules/creator/views/creator_view.dart';
import '../modules/feed/bindings/feed_binding.dart';
import '../modules/feed/views/feed_view.dart';
import '../modules/home/bindings/home_binding.dart';
import '../modules/home/views/home_view.dart';
import '../modules/notifications/bindings/notifications_binding.dart';
import '../modules/notifications/views/notifications_view.dart';
import 'app_routes.dart';

class AppPages {
  static final routes = <GetPage<dynamic>>[
    GetPage<HomeView>(
      name: AppRoutes.home,
      page: HomeView.new,
      binding: HomeBinding(),
      participatesInRootNavigator: true,
    ),
    GetPage<FeedView>(
      name: AppRoutes.feed,
      page: FeedView.new,
      binding: FeedBinding(),
      participatesInRootNavigator: true,
    ),
    GetPage<CreatorView>(
      name: AppRoutes.creator,
      page: CreatorView.new,
      binding: CreatorBinding(),
      participatesInRootNavigator: true,
    ),
    GetPage<CreatePostView>(
      name: AppRoutes.creatorNewPost,
      page: CreatePostView.new,
      binding: CreatorBinding(),
      participatesInRootNavigator: true,
    ),
    GetPage<AdminView>(
      name: AppRoutes.admin,
      page: AdminView.new,
      binding: AdminBinding(),
      participatesInRootNavigator: true,
    ),
    GetPage<AuthView>(
      name: AppRoutes.auth,
      page: AuthView.new,
      binding: AuthBinding(),
      participatesInRootNavigator: true,
    ),
    GetPage<NotificationsView>(
      name: AppRoutes.notifications,
      page: NotificationsView.new,
      binding: NotificationsBinding(),
      participatesInRootNavigator: true,
    ),
  ];

  AppPages._();
}
