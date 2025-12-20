import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../widgets/app_scaffold.dart';
import '../controllers/feed_controller.dart';

class FeedView extends GetView<FeedController> {
  const FeedView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AppScaffold(
      title: 'Feed',
      selectedIndex: 1,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Fan feed (Flutter)',
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'This is backed by the Express API: /posts (with entitlement flags).',
              style:
                  theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Obx(() {
                if (controller.isLoading.value && controller.posts.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator.adaptive(),
                  );
                }

                final err = controller.errorMessage.value;
                if (err != null && controller.posts.isEmpty) {
                  return Center(
                    child: Text(
                      err,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  );
                }

                return RefreshIndicator.adaptive(
                  onRefresh: controller.fetchPosts,
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: controller.posts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final post = controller.posts[index];
                      final title = (post['title'] ?? '').toString();
                      final body = (post['body'] ?? '').toString();
                      final priceType = (post['priceType'] ?? '').toString();
                      final entitled = post['entitled'] == true;
                      final creatorName = (post['creator'] is Map)
                          ? ((post['creator'] as Map)['displayName'] ?? '')
                              .toString()
                          : '';
                      final creatorId = (post['creator'] is Map)
                          ? ((post['creator'] as Map)['id'] ?? '').toString()
                          : '';
                      final postId = (post['id'] ?? '').toString();
                      final priceCents =
                          int.tryParse(post['priceCents'].toString()) ?? 0;

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white10),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.article_outlined,
                                  color: Colors.white70,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    title.isEmpty ? '(untitled)' : title,
                                    style:
                                        theme.textTheme.titleMedium?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                _Badge(text: priceType, tone: Colors.white),
                                const SizedBox(width: 8),
                                _Badge(
                                  text: entitled ? 'ENTITLED' : 'LOCKED',
                                  tone: entitled
                                      ? const Color(0xFF22D3EE)
                                      : Colors.white54,
                                ),
                              ],
                            ),
                            if (creatorName.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                'by $creatorName',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.white60,
                                ),
                              ),
                            ],
                            const SizedBox(height: 10),
                            Text(
                              body,
                              maxLines: 4,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: Colors.white70,
                                height: 1.35,
                              ),
                            ),
                            if (!entitled) ...[
                              const SizedBox(height: 16),
                              if (priceType == 'SUBSCRIBER')
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton.icon(
                                    onPressed: () =>
                                        controller.subscribe(creatorId),
                                    icon: const Icon(Icons.star_border),
                                    label: const Text('Subscribe to Unlock'),
                                    style: FilledButton.styleFrom(
                                      backgroundColor: Colors.purpleAccent,
                                    ),
                                  ),
                                ),
                              if (priceType == 'PPV')
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton.icon(
                                    onPressed: () => controller.unlock(postId),
                                    icon: const Icon(Icons.lock_open),
                                    label: Text(
                                        'Unlock for \$${(priceCents / 100).toStringAsFixed(2)}'),
                                    style: FilledButton.styleFrom(
                                      backgroundColor: Colors.amber[800],
                                    ),
                                  ),
                                ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color tone;

  const _Badge({required this.text, required this.tone});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tone.withValues(alpha: 0.30)),
      ),
      child: Text(
        text,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: tone.withValues(alpha: 0.95),
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
      ),
    );
  }
}
