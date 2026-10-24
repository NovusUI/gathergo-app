import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function useHomeReachability(restingHeight: number, maxExpansion: number) {
  const reducedMotion = useReducedMotionPreference();
  const [expanded, setExpanded] = useState(false);
  const headerHeight = useSharedValue(restingHeight);
  const settledExpanded = useSharedValue(false);
  const scrollY = useSharedValue(0);
  const startedAtTop = useSharedValue(true);
  const startHeight = useSharedValue(restingHeight);
  const startTranslation = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const active = useSharedValue(false);
  const expandedHeight = restingHeight + maxExpansion;

  const settle = useCallback((open: boolean, velocity = 0) => {
    "worklet";
    const nextExpanded = open && maxExpansion > 0;
    settledExpanded.value = nextExpanded;
    const target = nextExpanded ? expandedHeight : restingHeight;
    headerHeight.value = reducedMotion ? target : withSpring(target, {
      stiffness: 240,
      damping: 30,
      mass: 1,
      velocity,
      overshootClamping: true,
    });
    runOnJS(setExpanded)(nextExpanded);
  }, [expandedHeight, headerHeight, maxExpansion, reducedMotion, restingHeight, settledExpanded]);

  useEffect(() => {
    cancelAnimation(headerHeight);
    const nextExpanded = settledExpanded.value && maxExpansion > 0;
    settledExpanded.value = nextExpanded;
    headerHeight.value = nextExpanded ? expandedHeight : restingHeight;
    setExpanded(nextExpanded);
    return () => cancelAnimation(headerHeight);
  }, [expandedHeight, headerHeight, maxExpansion, restingHeight, settledExpanded]);

  const scrollGesture = useMemo(() => Gesture.Native(), []);
  const panGesture = useMemo(() => Gesture.Pan()
    .enabled(maxExpansion > 0)
    .maxPointers(1)
    .manualActivation(true)
    .blocksExternalGesture(scrollGesture)
    .onTouchesDown((event) => {
      startedAtTop.value = scrollY.value <= 1;
      touchX.value = event.allTouches[0].absoluteX;
      touchY.value = event.allTouches[0].absoluteY;
    })
    .onTouchesMove((event, manager) => {
      if (active.value) return;
      if (!startedAtTop.value) {
        manager.fail();
        return;
      }
      const dx = event.allTouches[0].absoluteX - touchX.value;
      const dy = event.allTouches[0].absoluteY - touchY.value;
      if (Math.abs(dx) > 10 && Math.abs(dx) * 1.4 >= Math.abs(dy)) {
        manager.fail();
      } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.4) {
        // Let the feed scroll when the header has no room in this direction.
        if (dy > 0 ? headerHeight.value >= expandedHeight - 1 : headerHeight.value <= restingHeight + 1) manager.fail();
        else manager.activate();
      }
    })
    .onStart((event) => {
      cancelAnimation(headerHeight);
      active.value = true;
      startHeight.value = headerHeight.value;
      startTranslation.value = event.translationY;
    })
    .onUpdate((event) => {
      headerHeight.value = Math.max(restingHeight, Math.min(expandedHeight,
        startHeight.value + event.translationY - startTranslation.value));
    })
    .onEnd((event, success) => {
      if (success) settle(headerHeight.value + event.velocityY * 0.12 > restingHeight + maxExpansion / 2, event.velocityY);
    })
    .onFinalize((_event, success) => {
      if (active.value && !success) settle(settledExpanded.value);
      active.value = false;
    }), [active, expandedHeight, headerHeight, maxExpansion, restingHeight, scrollGesture, scrollY, settle, settledExpanded, startHeight, startedAtTop, startTranslation, touchX, touchY]);

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: (event) => { scrollY.value = Math.max(0, event.contentOffset.y); },
    onScroll: (event) => { scrollY.value = Math.max(0, event.contentOffset.y); },
  });
  const headerStyle = useAnimatedStyle(() => ({ height: headerHeight.value }));
  const toggle = useCallback(() => runOnUI(settle)(!expanded), [expanded, settle]);

  return { headerHeight, headerStyle, expanded, panGesture, scrollGesture, scrollHandler, toggle };
}
