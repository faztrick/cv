import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../widgets/app_scaffold.dart';
import '../controllers/notifications_controller.dart';

class NotificationsView extends GetView<NotificationsController> {
  const NotificationsView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AppScaffold(
      title: 'Notifications',
      selectedIndex: -1, // Not a main tab
      child: Obx(() {
        if (controller.isLoading.value && controller.notifications.isEmpty) {
          return const Center(child: CircularProgressIndicator.adaptive());
        }

        if (controller.notifications.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.notifications_off_outlined,
                    size: 64, color: Colors.white24),
                const SizedBox(height: 16),
                Text(
                  'No notifications yet',
                  style: theme.textTheme.titleMedium
                      ?.copyWith(color: Colors.white54),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator.adaptive(
          onRefresh: controller.fetchNotifications,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: controller.notifications.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final notification = controller.notifications[index];
              final id = (notification['id'] ?? '').toString();
              final type = (notification['type'] ?? '').toString();
              final data = notification['data'] as Map<String, dynamic>? ?? {};
              final readAt = notification['readAt'];
              final isRead = readAt != null;
              final createdAt = DateTime.tryParse(
                      (notification['createdAt'] ?? '').toString()) ??
                  DateTime.now();

              return InkWell(
                onTap: () {
                  if (!isRead) controller.markAsRead(id);
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isRead
                        ? Colors.white.withValues(alpha: 0.03)
                        : Colors.purpleAccent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isRead
                          ? Colors.white10
                          : Colors.purpleAccent.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _getIconForType(type),
                          size: 20,
                          color: Colors.white70,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getMessageForType(type, data),
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: Colors.white,
                                fontWeight: isRead
                                    ? FontWeight.normal
                                    : FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              DateFormat.yMMMd().add_jm().format(createdAt),
                              style: theme.textTheme.bodySmall
                                  ?.copyWith(color: Colors.white38),
                            ),
                          ],
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.purpleAccent,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      }),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'post.created':
        return Icons.article_outlined;
      case 'subscription.new':
        return Icons.star_outline;
      case 'post.unlocked':
        return Icons.lock_open_outlined;
      case 'creator.approved':
        return Icons.verified_outlined;
      case 'creator.rejected':
        return Icons.block_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  String _getMessageForType(String type, Map<String, dynamic> data) {
    switch (type) {
      case 'post.created':
        return 'New post from a creator you follow!';
      case 'subscription.new':
        return 'You have a new subscriber!';
      case 'post.unlocked':
        return 'Someone unlocked your post!';
      case 'creator.approved':
        return 'Your creator application has been approved!';
      case 'creator.rejected':
        return 'Your creator application was rejected.';
      default:
        return 'New notification';
    }
  }
}
