import { ActivityIndicator, ActivityIndicatorProps } from "react-native";

const loaderColors = {
  accent: "#0FF1CF",
  dark: "#01082E",
  light: "#FFFFFF",
} as const;

type LoaderTone = keyof typeof loaderColors;

interface AppLoaderProps extends Omit<ActivityIndicatorProps, "color"> {
  tone?: LoaderTone;
  color?: string;
}

const AppLoader = ({
  tone = "accent",
  color,
  size = "small",
  ...props
}: AppLoaderProps) => (
  <ActivityIndicator
    {...props}
    size={size}
    color={color ?? loaderColors[tone]}
  />
);

export default AppLoader;
