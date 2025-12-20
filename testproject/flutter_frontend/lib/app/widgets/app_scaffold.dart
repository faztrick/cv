import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../routes/app_routes.dart';

class AppScaffold extends StatelessWidget {
  final String title;
  final int selectedIndex;
  final Widget child;
  final List<Widget>? actions;

  const AppScaffold({
    super.key,
    required this.title,
    required this.selectedIndex,
    required this.child,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Get.toNamed(AppRoutes.notifications),
          ),
          if (actions != null) ...actions!,
        ],
      ),
      extendBodyBehindAppBar: true,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF111827), Color(0xFF1F2937)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: DefaultTextStyle(
            style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.92),
                ) ??
                const TextStyle(color: Colors.white),
            child: child,
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: _onTap,
        backgroundColor: const Color(0xFF0B1220),
        indicatorColor: Colors.white.withValues(alpha: 0.10),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.dynamic_feed_outlined), label: 'Feed'),
          NavigationDestination(
              icon: Icon(Icons.workspace_premium_outlined), label: 'Creator'),
          NavigationDestination(
              icon: Icon(Icons.admin_panel_settings_outlined), label: 'Admin'),
          NavigationDestination(
              icon: Icon(Icons.login_outlined), label: 'Auth'),
        ],
      ),
    );
  }

  void _onTap(int index) {
    final target = switch (index) {
      0 => AppRoutes.home,
      1 => AppRoutes.feed,
      2 => AppRoutes.creator,
      3 => AppRoutes.admin,
      4 => AppRoutes.auth,
      _ => AppRoutes.home,
    };

    if (Get.currentRoute == target) return;
    Get.offNamed(target);
  }
}
