import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../routes/app_routes.dart';
import '../../../widgets/app_scaffold.dart';
import '../controllers/creator_controller.dart';

class CreatorView extends GetView<CreatorController> {
  const CreatorView({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Creator',
      selectedIndex: 2,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        child: Obx(() {
          if (controller.isLoading.value &&
              controller.creatorProfile.value == null) {
            return const Center(
                child: Padding(
              padding: EdgeInsets.all(20.0),
              child: CircularProgressIndicator.adaptive(),
            ));
          }

          final profile = controller.creatorProfile.value;

          if (profile == null) {
            return _buildApplyForm(context);
          }

          final status = profile['status'];
          if (status == 'APPROVED') {
            return _buildDashboard(context, profile);
          }

          return _buildStatusView(context, profile);
        }),
      ),
    );
  }

  Widget _buildApplyForm(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Become a Creator',
          style: theme.textTheme.headlineSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Apply to start posting content and earning.',
          style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
        ),
        const SizedBox(height: 24),
        _Field(
          label: 'Display Name',
          onChanged: (v) => controller.displayName.value = v,
        ),
        const SizedBox(height: 16),
        _Field(
          label: 'Bio',
          onChanged: (v) => controller.bio.value = v,
          maxLines: 3,
        ),
        const SizedBox(height: 24),
        Obx(() {
          final loading = controller.isLoading.value;
          return SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: loading ? null : controller.submitForReview,
              icon: const Icon(Icons.send_outlined),
              label: Text(loading ? 'Submitting…' : 'Submit Application'),
            ),
          );
        }),
        const SizedBox(height: 16),
        Obx(() {
          final msg = controller.message.value;
          if (msg == null) return const SizedBox.shrink();
          return Text(
            msg,
            style:
                theme.textTheme.bodyMedium?.copyWith(color: Colors.redAccent),
          );
        }),
      ],
    );
  }

  Widget _buildDashboard(BuildContext context, Map<String, dynamic> profile) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.verified, color: Colors.blueAccent),
            const SizedBox(width: 8),
            Text(
              profile['displayName'] ?? 'Creator',
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white10),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Create New Post',
                style: theme.textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Post creation form will go here (Title, Body, Price).',
                style: TextStyle(color: Colors.white60),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () {
                  Get.toNamed(AppRoutes.creatorNewPost);
                },
                icon: const Icon(Icons.add),
                label: const Text('Create Post'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusView(BuildContext context, Map<String, dynamic> profile) {
    final theme = Theme.of(context);
    final status = profile['status'] ?? 'PENDING';
    final color = status == 'REJECTED' ? Colors.red : Colors.orange;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.pending_actions_outlined, size: 64, color: color),
          const SizedBox(height: 16),
          Text(
            'Application $status',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your creator application is currently $status.',
            style: theme.textTheme.bodyLarge?.copyWith(color: Colors.white70),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final ValueChanged<String> onChanged;
  final int maxLines;

  const _Field({
    required this.label,
    required this.onChanged,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: onChanged,
      maxLines: maxLines,
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
