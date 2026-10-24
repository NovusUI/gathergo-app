import {
  Platform,
  RefreshControl,
  type RefreshControlProps,
  StyleSheet,
} from "react-native";
import AppLoader from "./AppLoader";

const transparentColors = ["transparent"];

// Keep Android’s native refresh circle outside the viewport so only Gogo is visible.
export const nativeRefreshIndicatorOffset =
  Platform.OS === "android" ? -1000 : 0;

export default function AppRefreshControl(
  props: Omit<
    RefreshControlProps,
    "colors" | "tintColor" | "progressBackgroundColor" | "progressViewOffset"
  >,
) {
  // Keep the native pull gesture and controlled refresh lifecycle; the list
  // header displays Gogo instead of the platform's built-in spinner.
  return (
    <RefreshControl
      {...props}
      tintColor="transparent"
      colors={transparentColors}
      progressBackgroundColor="transparent"
      progressViewOffset={nativeRefreshIndicatorOffset}
    />
  );
}

export function RefreshIndicator({
  refreshing,
}: Pick<RefreshControlProps, "refreshing">) {
  return refreshing ? (
    <AppLoader accessibilityLabel="Refreshing" style={styles.indicator} />
  ) : null;
}

const styles = StyleSheet.create({ indicator: { paddingVertical: 12 } });
