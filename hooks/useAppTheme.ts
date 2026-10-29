import { useAppearanceStore } from "@/store/appearance";
import { getAppTheme } from "@/utils/theme";
import { useColorScheme } from "react-native";

export function useAppTheme() {
  const preference = useAppearanceStore((state) => state.mode);
  const systemMode = useColorScheme();
  const mode = preference === "system" ? systemMode ?? "light" : preference;
  return getAppTheme(mode);
}
