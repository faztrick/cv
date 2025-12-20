import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:get/get.dart';

import '../../../data/models/cv_models.dart';
import '../controllers/home_controller.dart';
import 'widgets/experience_tile.dart';
import 'widgets/hero_header.dart';
import 'widgets/info_chip.dart';
import 'widgets/metric_pill.dart';
import 'widgets/section_card.dart';
import 'widgets/social_links.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF111827), Color(0xFF1F2937)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Obx(() {
            if (controller.isLoading.value) {
              return const Center(
                child: CircularProgressIndicator.adaptive(),
              );
            }

            if (controller.errorMessage.value != null) {
              return Center(
                child: Text(
                  controller.errorMessage.value!,
                  style: Theme.of(context)
                      .textTheme
                      .bodyLarge
                      ?.copyWith(color: Colors.white70),
                ),
              );
            }

            final cv = controller.cv.value!;
            final theme = Theme.of(context);
            final keywords = controller.keywords;

            return CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        HeroHeader(personal: cv.personal, keywords: keywords),
                        const SizedBox(height: 18),
                        SectionCard(
                          title: 'Fan Hub',
                          subtitle: 'Follow, subscribe, and connect',
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Wrap(
                                spacing: 10,
                                runSpacing: 10,
                                children: [
                                  MetricPill(
                                    label: 'Years crafting products',
                                    value: '13+',
                                    icon: Icons.calendar_month_outlined,
                                  ),
                                  MetricPill(
                                    label: 'Products shipped',
                                    value: '25+',
                                    icon: Icons.rocket_launch_outlined,
                                  ),
                                  MetricPill(
                                    label: 'Happy users',
                                    value: '50K+',
                                    icon: Icons.favorite_border,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              SocialLinksRow(
                                links: buildDefaultLinks(
                                  website: cv.personal.website,
                                  github: cv.personal.github,
                                  linkedin: cv.personal.linkedin,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        SectionCard(
                          title: 'About',
                          subtitle: 'Snapshot of profile & strengths',
                          child: Text(
                            cv.summary.replaceAll('---', '').trim(),
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withOpacity(0.9),
                              height: 1.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SectionCard(
                          title: 'Skills',
                          subtitle: 'Top capabilities & stacks',
                          child: Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: cv.skills
                                .topSkills(max: 18)
                                .map((s) => InfoChip(label: s))
                                .toList(),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SectionCard(
                          title: 'Experience',
                          subtitle: 'Recent roles & impact',
                          child: Column(
                            children: cv.experience
                                .map((item) => ExperienceTile(experience: item))
                                .toList(),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SectionCard(
                          title: 'Projects',
                          subtitle: 'Products & solutions delivered',
                          padding: const EdgeInsets.all(4),
                          child: MasonryGridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            itemCount: cv.projects.length,
                            itemBuilder: (context, index) {
                              final project = cv.projects[index];
                              return _ProjectCard(project: project);
                            },
                          ),
                        ),
                        const SizedBox(height: 20),
                        Center(
                          child: Text(
                            'Crafted with Flutter + GetX (MVVM)',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: Colors.white54,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Project project;
  const _ProjectCard({required this.project});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            border: Border.all(color: Colors.white10),
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 34,
                    width: 34,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF22D3EE), Color(0xFF4F46E5)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child:
                        const Icon(Icons.bolt, color: Colors.white, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      project.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                project.description,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.white70,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
