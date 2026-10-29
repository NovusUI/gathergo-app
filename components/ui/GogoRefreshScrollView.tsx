import { useGogoPullToRefresh } from "@/hooks/useGogoPullToRefresh";
import { createContext, forwardRef, useContext, type ComponentRef } from "react";
import {
  StyleSheet,
  View,
  type RefreshControlProps,
  type ScrollViewProps,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import AppLoader from "./AppLoader";

type Props = Omit<ScrollViewProps, "refreshControl"> & {
  refreshing: boolean;
  onRefresh: NonNullable<RefreshControlProps["onRefresh"]>;
  inlineIndicator?: boolean;
};

const RefreshContext = createContext<ReturnType<typeof useGogoPullToRefresh> | null>(
  null,
);

export function RefreshIndicator() {
  const refresh = useContext(RefreshContext);
  if (!refresh) throw new Error("RefreshIndicator requires GogoRefreshScrollView");
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.reveal, refresh.revealStyle]}
    >
      <Animated.View style={refresh.artworkStyle}>
        <AppLoader
          size={40}
          animating={refresh.busy}
          hidesWhenStopped={false}
          pullProgress={refresh.pullProgress}
          accessibilityLabel="Refreshing"
        />
      </Animated.View>
    </Animated.View>
  );
}

export default forwardRef<ComponentRef<typeof Animated.ScrollView>, Props>(function GogoRefreshScrollView({
  refreshing,
  onRefresh,
  inlineIndicator = false,
  onScroll,
  onAccessibilityAction,
  accessibilityActions = [],
  style,
  contentContainerStyle,
  children,
  ...props
}: Props, ref) {
  const refresh = useGogoPullToRefresh({ refreshing, onRefresh, onScroll });
  return (
    <RefreshContext.Provider value={refresh}>
      <View style={[styles.viewport, style]}>
        {!inlineIndicator ? (
          <View pointerEvents="none" style={styles.overlay}>
            <RefreshIndicator />
          </View>
        ) : null}
        <GestureDetector gesture={refresh.panGesture}>
          <Animated.View
            collapsable={false}
            style={[styles.fill, !inlineIndicator && refresh.contentStyle]}
          >
            <GestureDetector gesture={refresh.scrollGesture}>
              <Animated.ScrollView
                {...props}
                ref={ref}
                style={styles.fill}
                contentContainerStyle={[styles.content, contentContainerStyle]}
                onScroll={refresh.scrollHandler}
                scrollEventThrottle={16}
                bounces={false}
                overScrollMode="never"
                accessibilityActions={[
                  ...accessibilityActions,
                  { name: "refresh", label: "Refresh" },
                ]}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === "refresh") refresh.refresh();
                  else onAccessibilityAction?.(event);
                }}
              >
                {children}
              </Animated.ScrollView>
            </GestureDetector>
          </Animated.View>
        </GestureDetector>
      </View>
    </RefreshContext.Provider>
  );
});

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: "hidden" },
  fill: { flex: 1 },
  content: { flexGrow: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  reveal: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
