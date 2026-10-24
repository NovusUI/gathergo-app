import { useAppearanceStore } from "@/store/appearance";
import { getAppTheme } from "@/utils/theme";

export function useAppTheme() {
  const mode = useAppearanceStore((state) => state.mode);
  return getAppTheme(mode);
}
