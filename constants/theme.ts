export type ThemeMode = "light" | "dark";

export const LIGHT_COLORS = {
  background: "#F3FFFB",
  surface: "#FFFFFF",
  surfaceMuted: "#E7FBF5",
  surfaceRaised: "#D6F6ED",
  foreground: "#0B3B35",
  secondary: "#355F58",
  muted: "#4B7069",
  subtle: "#6B8C84",
  border: "#CEEDE4",
  borderStrong: "#95CDBC",
  accent: "#087A66",
  accentFill: "#1EEBC8",
  accentSoft: "#DCF9F0",
  onAccent: "#0B3B35",
  primary: "#0B3B35",
  onPrimary: "#FFFFFF",
  info: "#315DAB",
  infoSoft: "#EBF3FF",
  danger: "#B52D4D",
  dangerSoft: "#FFF0F3",
  warning: "#795D00",
  warningFill: "#FFD84D",
  warningSoft: "#FFF8DB",
  success: "#087A66",
  successSoft: "#E7FAEF",
} as const;
export type ThemeColorRole = keyof typeof LIGHT_COLORS;
export type ThemeColors = Record<ThemeColorRole, string>;
export type ThemeColor = (darkColor: string, lightRole: ThemeColorRole) => string;

export const DARK_COLORS: ThemeColors = {
  background: "#01082E",
  surface: "#101C45",
  surfaceMuted: "#1B2A50",
  surfaceRaised: "#2B3C66",
  foreground: "#FFFFFF",
  secondary: "#CBD8FF",
  muted: "#8FA5E2",
  subtle: "#6B7280",
  border: "#24345A",
  borderStrong: "#3B4A73",
  accent: "#0FF1CF",
  accentFill: "#0FF1CF",
  accentSoft: "#193744",
  onAccent: "#01082E",
  primary: "#5669FF",
  onPrimary: "#FFFFFF",
  info: "#31C6F6",
  infoSoft: "#0A1E63",
  danger: "#FF6B9D",
  dangerSoft: "#351238",
  warning: "#FFD76A",
  warningFill: "#F8D05C",
  warningSoft: "#2A2209",
  success: "#6BFF6B",
  successSoft: "#0F3A32",

};

export const themeColors = { light: LIGHT_COLORS, dark: DARK_COLORS };
export const resolveThemeColor = (mode: ThemeMode, darkColor: string, role: ThemeColorRole) =>
  mode === "dark" ? darkColor : LIGHT_COLORS[role];
