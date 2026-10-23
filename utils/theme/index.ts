import { LIGHT_COLORS, resolveThemeColor, themeColors, type ThemeMode } from "@/constants/theme";
import { create } from "twrnc";

const createAppTheme = (mode: ThemeMode) => {
  // twrnc 4.11 exposes this method at runtime but omits it from TailwindFn.
  const tw = create({ theme: { extend: { colors: themeColors[mode] } } }) as ReturnType<typeof create> & {
    setColorScheme: (mode: ThemeMode) => void;
  };
  tw.setColorScheme(mode);
  return {
    mode,
    colors: themeColors[mode],
    tw,
    color: (darkColor: string, role: keyof typeof LIGHT_COLORS) => resolveThemeColor(mode, darkColor, role),
  };
};
const themes = { light: createAppTheme("light"), dark: createAppTheme("dark") };
export const getAppTheme = (mode: ThemeMode) => themes[mode];
