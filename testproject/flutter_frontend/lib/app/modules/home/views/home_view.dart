import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../routes/app_routes.dart';
import '../../../widgets/app_scaffold.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AppScaffold(
      title: 'FanHouse',
      selectedIndex: 0,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Home',
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            Obx(() {
              final email = controller.email;
              return Text(
                email == null
                    ? 'Not signed in. Use Auth to register/login.'
                    : 'Signed in as $email',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                ),
              );
            }),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.tonalIcon(
                  onPressed: () => Get.toNamed(AppRoutes.auth),
                  icon: const Icon(Icons.login_outlined),
                  label: const Text('Auth'),
                ),
                FilledButton.tonalIcon(
                  onPressed: () => Get.toNamed(AppRoutes.feed),
                  icon: const Icon(Icons.dynamic_feed_outlined),
                  label: const Text('Feed'),
                ),
                FilledButton.tonalIcon(
                  onPressed: () => Get.toNamed(AppRoutes.creator),
                  icon: const Icon(Icons.workspace_premium_outlined),
                  label: const Text('Creator'),
                ),
                FilledButton.tonalIcon(
                  onPressed: () => Get.toNamed(AppRoutes.admin),
                  icon: const Icon(Icons.admin_panel_settings_outlined),
                  label: const Text('Admin'),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Text(
                'CV/resume demo content has been removed. This app now focuses on the FanHouse-style pages wired to the Express API.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                  height: 1.35,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
