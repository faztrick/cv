import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../widgets/app_scaffold.dart';
import '../controllers/creator_controller.dart';

class CreatePostView extends GetView<CreatorController> {
  const CreatePostView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AppScaffold(
      title: 'New Post',
      selectedIndex: 2, // Keep Creator tab active
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Create Post',
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            _Field(
              label: 'Title',
              onChanged: (v) => controller.postTitle.value = v,
            ),
            const SizedBox(height: 16),
            _Field(
              label: 'Body',
              onChanged: (v) => controller.postBody.value = v,
              maxLines: 5,
            ),
            const SizedBox(height: 16),
            Obx(() => DropdownButtonFormField<String>(
                  initialValue: controller.postPriceType.value,
                  dropdownColor: Colors.grey[900],
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Access',
                    labelStyle: const TextStyle(color: Colors.white70),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.06),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Colors.white12),
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'FREE', child: Text('Free')),
                    DropdownMenuItem(
                        value: 'SUBSCRIBER', child: Text('Subscribers Only')),
                    DropdownMenuItem(value: 'PPV', child: Text('Pay Per View')),
                  ],
                  onChanged: (v) {
                    if (v != null) controller.postPriceType.value = v;
                  },
                )),
            const SizedBox(height: 16),
            Obx(() {
              if (controller.postPriceType.value == 'PPV') {
                return _Field(
                  label: 'Price (Cents)',
                  keyboardType: TextInputType.number,
                  onChanged: (v) =>
                      controller.postPriceCents.value = int.tryParse(v) ?? 0,
                );
              }
              return const SizedBox.shrink();
            }),
            const SizedBox(height: 24),
            Obx(() {
              final loading = controller.isLoading.value;
              return SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: loading ? null : controller.createPost,
                  icon: const Icon(Icons.post_add),
                  label: Text(loading ? 'Publishing…' : 'Publish Post'),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final ValueChanged<String> onChanged;
  final int maxLines;
  final TextInputType? keyboardType;

  const _Field({
    required this.label,
    required this.onChanged,
    this.maxLines = 1,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: onChanged,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white70),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.06),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.40)),
        ),
      ),
    );
  }
}
