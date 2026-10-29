import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import type { RefreshControlProps, ScrollViewProps } from "react-native";
import {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const refreshHeight = 64;
const maxPullHeight = 112;

export function useGogoPullToRefresh({
  refreshing,
  onRefresh,
  onScroll,
}: {
  refreshing: boolean;
  onRefresh: NonNullable<RefreshControlProps["onRefresh"]>;
  onScroll?: ScrollViewProps["onScroll"];
}) {
  const reducedMotion = useReducedMotionPreference();
  const [request, setRequest] = useState({ pending: false });
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const busy = refreshing || request.pending;
  const pull = useSharedValue(0);
  const locked = useSharedValue(busy);
  const scrollY = useSharedValue(0);
  const startedAtTop = useSharedValue(false);
  const active = useSharedValue(false);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const startPull = useSharedValue(0);
  const startTranslation = useSharedValue(0);

  const settle = useCallback((height: number) => {
    "worklet";
    pull.value = reducedMotion ? height : withSpring(height, {
      stiffness: 240,
      damping: 28,
      mass: 1,
      overshootClamping: true,
    });
  }, [pull, reducedMotion]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelAnimation(pull);
    };
  }, [pull]);

  useEffect(() => {
    // A completed request must settle even when React batches a fast response.
    locked.value = busy;
    if (!active.value) settle(busy ? refreshHeight : 0);
  }, [active, busy, locked, request, settle]);

  const requestRefresh = useCallback(async () => {
    if (!mounted.current || inFlight.current || refreshing) return;
    inFlight.current = true;
    setRequest({ pending: true });
    try {
      await onRefresh();
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setRequest({ pending: false });
      }
    }
  }, [onRefresh, refreshing]);

  const scrollGesture = useMemo(() => Gesture.Native(), []);
  const panGesture = useMemo(() => Gesture.Pan()
    .enabled(!busy)
    .maxPointers(1)
    .manualActivation(true)
    .blocksExternalGesture(scrollGesture)
    .onTouchesDown((event) => {
      startedAtTop.value = scrollY.value <= 1 && !locked.value;
      touchX.value = event.allTouches[0].absoluteX;
      touchY.value = event.allTouches[0].absoluteY;
    })
    .onTouchesMove((event, manager) => {
      if (active.value) return;
      if (!startedAtTop.value || locked.value || event.numberOfTouches !== 1) {
        manager.fail();
        return;
      }
      const dx = event.allTouches[0].absoluteX - touchX.value;
      const dy = event.allTouches[0].absoluteY - touchY.value;
      if (Math.abs(dx) > 10 && Math.abs(dx) * 1.4 >= Math.abs(dy)) {
        manager.fail();
      } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.4) {
        if (dy > 0) manager.activate();
        else manager.fail();
      }
    })
    .onStart((event) => {
      cancelAnimation(pull);
      active.value = true;
      startPull.value = pull.value;
      startTranslation.value = event.translationY;
    })
    .onUpdate((event) => {
      pull.value = Math.max(0, Math.min(maxPullHeight,
        startPull.value + (event.translationY - startTranslation.value) * 0.5));
    })
    .onEnd((_event, success) => {
      if (success && pull.value >= refreshHeight && !locked.value) {
        // Lock on the UI thread before requesting data on the JS thread.
        locked.value = true;
        settle(refreshHeight);
        runOnJS(requestRefresh)();
      } else {
        settle(0);
      }
    })
    .onFinalize((_event, success) => {
      if (active.value && !success) settle(locked.value ? refreshHeight : 0);
      active.value = false;
    }), [active, busy, locked, pull, requestRefresh, scrollGesture, scrollY, settle, startPull, startedAtTop, startTranslation, touchX, touchY]);

  const scrollHandler = useCallback<NonNullable<ScrollViewProps["onScroll"]>>((event) => {
    scrollY.value = Math.max(0, event.nativeEvent.contentOffset.y);
    onScroll?.(event);
  }, [onScroll, scrollY]);
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pull.value }],
  }));
  const revealStyle = useAnimatedStyle(() => ({
    height: pull.value,
    opacity: Math.min(1, pull.value / 24),
  }));
  const pullProgress = useDerivedValue(() => Math.min(1, pull.value / refreshHeight));
  const artworkStyle = useAnimatedStyle(() => {
    const progress = pullProgress.value;
    return {
      transform: [
        { scale: reducedMotion ? 1 : 0.75 + progress * 0.25 },
        { rotate: `${reducedMotion ? 0 : -20 * (1 - progress)}deg` },
      ],
    };
  });
  const refresh = useCallback(() => {
    if (locked.value) return;
    locked.value = true;
    runOnUI(settle)(refreshHeight);
    void requestRefresh();
  }, [locked, requestRefresh, settle]);

  return { busy, panGesture, scrollGesture, scrollHandler, contentStyle, revealStyle, artworkStyle, pullProgress, refresh };
}
