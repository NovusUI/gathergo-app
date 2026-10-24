import { getAdaptiveLayout } from "@/utils/layout";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useResponsiveLayout({ hasTabNavigation = true }: { hasTabNavigation?: boolean } = {}) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = getAdaptiveLayout(
    width - insets.left - insets.right,
    height - insets.top - insets.bottom,
    fontScale,
    hasTabNavigation,
  );
  return { ...layout, insets, fontScale };
}
