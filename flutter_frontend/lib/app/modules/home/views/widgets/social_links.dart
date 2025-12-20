import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

List<SocialLink> buildDefaultLinks({
  required String website,
  required String github,
  required String linkedin,
}) {
  return [
    SocialLink(
      label: 'Website',
      url: website,
      icon: Icons.web_asset_outlined,
      color: const Color(0xFF22D3EE),
    ),
    SocialLink(
      label: 'GitHub',
      url: github,
      icon: Icons.code,
      color: const Color(0xFF6366F1),
    ),
    SocialLink(
      label: 'LinkedIn',
      url: linkedin,
      icon: Icons.business_center_outlined,
      color: const Color(0xFF0A66C2),
    ),
  ];
}

class SocialLink {
  final String label;

  final String url;
  final IconData icon;
  final Color color;
  const SocialLink({
    required this.label,
    required this.url,
    required this.icon,
    required this.color,
  });
}

class SocialLinksRow extends StatelessWidget {
  final List<SocialLink> links;

  const SocialLinksRow({
    super.key,
    required this.links,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: links
          .map(
            (link) => _SocialButton(
              icon: link.icon,
              label: link.label,
              url: link.url,
              color: link.color,
            ),
          )
          .toList(),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;

  final String label;
  final String url;
  final Color color;
  const _SocialButton({
    required this.icon,
    required this.label,
    required this.url,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withOpacity(0.12),
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        side: BorderSide(color: color.withOpacity(0.25)),
      ),
      onPressed: () => _launch(url),
      icon: Icon(icon, size: 18),
      label: Text(
        label,
        style: theme.textTheme.labelLarge?.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
