import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../widgets/app_scaffold.dart';
import '../controllers/admin_controller.dart';

class AdminView extends GetView<AdminController> {
  const AdminView({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: AppScaffold(
        title: 'Admin',
        selectedIndex: 3,
        child: Column(
          children: [
            const TabBar(
              tabs: [
                Tab(text: 'Creators'),
                Tab(text: 'Ledger'),
              ],
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white60,
              indicatorColor: Colors.purpleAccent,
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _buildCreatorsList(context),
                  _buildLedgerList(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreatorsList(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Creator Management',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Approve or reject creator applications.',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value && controller.creators.isEmpty) {
                return const Center(
                    child: CircularProgressIndicator.adaptive());
              }

              if (controller.creators.isEmpty) {
                return Center(
                  child: Text(
                    'No creators found.',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: Colors.white70),
                  ),
                );
              }

              return RefreshIndicator.adaptive(
                onRefresh: controller.fetchCreators,
                child: ListView.separated(
                  itemCount: controller.creators.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final creator = controller.creators[index];
                    final name =
                        (creator['displayName'] ?? 'Unknown').toString();
                    final status = (creator['status'] ?? 'PENDING').toString();
                    final id = (creator['id'] ?? '').toString();
                    final email = (creator['user'] is Map
                            ? (creator['user']['email'] ?? '')
                            : '')
                        .toString();

                    Color statusColor = Colors.white70;
                    if (status == 'APPROVED') statusColor = Colors.green;
                    if (status == 'REJECTED') statusColor = Colors.red;
                    if (status == 'PENDING') statusColor = Colors.orange;

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
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name,
                                      style:
                                          theme.textTheme.titleMedium?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    if (email.isNotEmpty)
                                      Text(
                                        email,
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(color: Colors.white54),
                                      ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color:
                                          statusColor.withValues(alpha: 0.5)),
                                ),
                                child: Text(
                                  status,
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: statusColor,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (status == 'PENDING') ...[
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () => controller.rejectCreator(id),
                                  icon: const Icon(Icons.close,
                                      size: 18, color: Colors.redAccent),
                                  label: const Text('Reject',
                                      style:
                                          TextStyle(color: Colors.redAccent)),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(
                                        color: Colors.redAccent),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                FilledButton.icon(
                                  onPressed: () =>
                                      controller.approveCreator(id),
                                  icon: const Icon(Icons.check, size: 18),
                                  label: const Text('Approve'),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: Colors.green,
                                  ),
                                ),
                              ],
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
    );
  }

  Widget _buildLedgerList(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ledger',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Immutable record of all financial transactions.',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Obx(() {
              if (controller.transactions.isEmpty) {
                return Center(
                  child: Text(
                    'No transactions found.',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: Colors.white70),
                  ),
                );
              }

              return RefreshIndicator.adaptive(
                onRefresh: controller.fetchTransactions,
                child: ListView.separated(
                  itemCount: controller.transactions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final entry = controller.transactions[index];
                    final type = (entry['type'] ?? '').toString();
                    final amount =
                        int.tryParse(entry['amountCents'].toString()) ?? 0;
                    final date = (entry['createdAt'] ?? '').toString();

                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                type,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                date,
                                style: theme.textTheme.bodySmall
                                    ?.copyWith(color: Colors.white54),
                              ),
                            ],
                          ),
                          Text(
                            '\$${(amount / 100).toStringAsFixed(2)}',
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: Colors.greenAccent,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
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
    );
  }
}
