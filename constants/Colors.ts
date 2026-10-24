import { themeColors, type ThemeMode } from "./theme";

const navigationColors = (mode: ThemeMode) => {
  const colors = themeColors[mode];
  return {
    text: colors.foreground,
    background: colors.background,
    tint: colors.accent,
    icon: colors.muted,
    tabIconDefault: colors.muted,
    tabIconSelected: colors.accent,
  };
};
export const Colors = { light: navigationColors("light"), dark: navigationColors("dark") };
