export function getAdaptiveLayout(width: number, height: number, fontScale: number, hasTabNavigation = true) {
  const useNavigationRail = hasTabNavigation && width >= 840 && height >= 480;
  const navigationRailWidth = useNavigationRail ? (fontScale > 1.4 ? 104 : 88) : 0;
  const pageWidth = Math.min(width - navigationRailWidth, 1200);
  const horizontalPadding = pageWidth >= 600 ? 24 : 20;
  const columns = pageWidth >= 640 && fontScale <= 1.4 ? 2 : 1;
  const detailColumns = pageWidth >= 960 && fontScale <= 1.4 ? 2 : 1;
  const columnGap = 16;
  const cardWidth = (pageWidth - horizontalPadding * 2 - (columns - 1) * columnGap) / columns;
  const bannerHeight = Math.round((height < 500 ? 100 : columns === 2 ? 168 : 124) * fontScale);
  const reachExpansion = width < 600 && height >= 560 && fontScale <= 1.4
    ? Math.min(120, Math.round((height - 520) * 0.6))
    : 0;
  return {
    availableWidth: width,
    useNavigationRail,
    navigationRailWidth,
    pageWidth,
    horizontalPadding,
    columns,
    detailColumns,
    columnGap,
    cardWidth,
    bannerHeight,
    reachExpansion,
  };
}
