export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const layoutSpacing = {
  pageHorizontal: spacing.xl,
  pageTop: 40,
  pageBottom: spacing.xl,
  sectionGap: spacing.lg,
  cardPadding: spacing.lg,
  listGap: spacing.md,
  listBottomInset: 80,
} as const;
