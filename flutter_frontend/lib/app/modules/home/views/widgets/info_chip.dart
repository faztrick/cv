import 'package:flutter/material.dart';

class InfoChip extends StatelessWidget {
  final String label;
  final bool dense;
  final Color? background;
  final Color? borderColor;
  final Color? textColor;

  const InfoChip({
    super.key,
    required this.label,
    this.dense = false,
    this.background,
    this.borderColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final padding = dense
        ? const EdgeInsets.symmetric(horizontal: 10, vertical: 6)
        : const EdgeInsets.symmetric(horizontal: 12, vertical: 8);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: background ?? Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: borderColor ?? Colors.white.withOpacity(0.10),
        ),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelMedium?.copyWith(
          color: textColor ?? Colors.white.withOpacity(0.9),
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}
