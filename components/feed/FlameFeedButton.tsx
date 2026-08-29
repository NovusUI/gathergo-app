import { Ionicons } from "@expo/vector-icons";
import { GatherGoMascot } from "@/components/ui/GatherGoMascot";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Text,
  TouchableOpacity,
  type GestureResponderEvent,
  type PanResponderGestureState,
  useWindowDimensions,
  View
} from "react-native";
import tw from "twrnc";

interface FlameFeedButtonProps {
  unreadCount: number;
  onPress: () => void;
  disabled?: boolean;
  showCarpoolSignal?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const SIGNAL_CYCLE_MS = 5200;
const BUTTON_SIZE = 76;
const SIDE_INSET = 16;
const TOP_INSET = 72;
const BOTTOM_INSET = 32;
const DRAG_THRESHOLD = 6;
const PRESS_BLOCK_MS = 160;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function FlameFeedButton({
  unreadCount,
  onPress,
  disabled = false,
  showCarpoolSignal = false
}: FlameFeedButtonProps) {
  const { width, height } = useWindowDimensions();
  const maxX = Math.max(SIDE_INSET, width - BUTTON_SIZE - SIDE_INSET);
  const maxY = Math.max(TOP_INSET, height - BUTTON_SIZE - BOTTOM_INSET);
  const pulse = useRef(new Animated.Value(1)).current;
  const signalProgress = useRef(new Animated.Value(0)).current;
  const position = useRef(
    new Animated.ValueXY({ x: maxX, y: TOP_INSET })
  ).current;
  const previousUnreadRef = useRef(unreadCount);
  const latestPositionRef = useRef({ x: maxX, y: TOP_INSET });
  const dragStartRef = useRef({ x: maxX, y: TOP_INSET });
  const sideRef = useRef<"left" | "right">("right");
  const dragMovedRef = useRef(false);
  const lastDragEndAtRef = useRef(0);
  const disabledRef = useRef(disabled);
  const bounds = useMemo(
    () => ({
      minX: SIDE_INSET,
      maxX,
      minY: TOP_INSET,
      maxY,
      midpointX: width / 2
    }),
    [maxX, maxY, width]
  );
  const boundsRef = useRef(bounds);

  const feedOpacity = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [1, 1, 0, 0, 1]
  });
  const feedScale = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [1, 1, 0.82, 0.82, 1]
  });
  const carpoolOpacity = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [0, 0, 1, 1, 0]
  });
  const carpoolScale = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [0.96, 0.96, 1, 1, 0.96]
  });
  const signalRingScale = signalProgress.interpolate({
    inputRange: [0, 0.48, 0.66, 0.84, 1],
    outputRange: [0.92, 0.92, 1.16, 1.04, 0.92]
  });
  const signalRingOpacity = signalProgress.interpolate({
    inputRange: [0, 0.48, 0.66, 0.84, 1],
    outputRange: [0.16, 0.16, 0.34, 0.18, 0.16]
  });

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    boundsRef.current = bounds;

    const nextPosition = {
      x: sideRef.current === "left" ? bounds.minX : bounds.maxX,
      y: clamp(latestPositionRef.current.y, bounds.minY, bounds.maxY)
    };

    latestPositionRef.current = nextPosition;
    dragStartRef.current = nextPosition;
    position.setValue(nextPosition);
  }, [bounds, position]);

  const snapToNearestSide = useCallback(
    (x: number, y: number) => {
      const currentBounds = boundsRef.current;
      const nextSide =
        x + BUTTON_SIZE / 2 < currentBounds.midpointX ? "left" : "right";
      const nextPosition = {
        x: nextSide === "left" ? currentBounds.minX : currentBounds.maxX,
        y: clamp(y, currentBounds.minY, currentBounds.maxY)
      };

      sideRef.current = nextSide;
      latestPositionRef.current = nextPosition;
      dragStartRef.current = nextPosition;

      Animated.spring(position, {
        toValue: nextPosition,
        friction: 7,
        tension: 90,
        useNativeDriver: true
      }).start();
    },
    [position]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (
          _event: GestureResponderEvent,
          gesture: PanResponderGestureState
        ) =>
          !disabledRef.current &&
          Math.abs(gesture.dx) + Math.abs(gesture.dy) > DRAG_THRESHOLD,
        onPanResponderGrant: () => {
          dragMovedRef.current = false;
          position.stopAnimation((currentPosition) => {
            const currentBounds = boundsRef.current;
            const nextPosition = {
              x: clamp(
                currentPosition.x,
                currentBounds.minX,
                currentBounds.maxX
              ),
              y: clamp(
                currentPosition.y,
                currentBounds.minY,
                currentBounds.maxY
              )
            };

            latestPositionRef.current = nextPosition;
            dragStartRef.current = nextPosition;
          });
        },
        onPanResponderMove: (
          _event: GestureResponderEvent,
          gesture: PanResponderGestureState
        ) => {
          dragMovedRef.current = true;
          const currentBounds = boundsRef.current;
          const nextPosition = {
            x: clamp(
              dragStartRef.current.x + gesture.dx,
              currentBounds.minX,
              currentBounds.maxX
            ),
            y: clamp(
              dragStartRef.current.y + gesture.dy,
              currentBounds.minY,
              currentBounds.maxY
            )
          };

          latestPositionRef.current = nextPosition;
          position.setValue(nextPosition);
        },
        onPanResponderRelease: () => {
          if (dragMovedRef.current) {
            lastDragEndAtRef.current = Date.now();
          }

          snapToNearestSide(
            latestPositionRef.current.x,
            latestPositionRef.current.y
          );
        },
        onPanResponderTerminate: () => {
          snapToNearestSide(
            latestPositionRef.current.x,
            latestPositionRef.current.y
          );
        }
      }),
    [position, snapToNearestSide]
  );

  useEffect(() => {
    if (!showCarpoolSignal) {
      signalProgress.stopAnimation();
      signalProgress.setValue(0);
      return;
    }

    signalProgress.stopAnimation();
    signalProgress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(signalProgress, {
        toValue: 1,
        duration: SIGNAL_CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    loop.start();
    return () => {
      loop.stop();
      signalProgress.stopAnimation();
    };
  }, [showCarpoolSignal, signalProgress]);

  useEffect(() => {
    const prevUnread = previousUnreadRef.current;
    previousUnreadRef.current = unreadCount;

    if (unreadCount <= 0) return;

    pulse.setValue(1);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.18,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      })
    ]).start();

    if (unreadCount > prevUnread) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, [pulse, unreadCount]);

  const handlePress = useCallback(() => {
    if (Date.now() - lastDragEndAtRef.current < PRESS_BLOCK_MS) return;

    onPress();
  }, [onPress]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      pointerEvents={disabled ? "none" : "auto"}
      style={[
        tw`absolute left-0 top-0`,
        { transform: position.getTranslateTransform() }
      ]}
    >
      <AnimatedTouchable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          showCarpoolSignal
            ? "Open live feed and carpool companion"
            : "Open live feed"
        }
        style={[
          tw`relative items-center justify-center rounded-full border border-[#0FF1CF]/30 bg-[#041130]/90 p-1`,
          { transform: [{ scale: pulse }] }
        ]}
      >
        {unreadCount > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              tw`absolute inset-0 rounded-full bg-[#0FF1CF]/10`,
              {
                opacity: signalRingOpacity,
                transform: [{ scale: signalRingScale }]
              }
            ]}
          />
        ) : null}
        <View style={tw`h-[66px] w-[66px] items-center justify-center`}>
          <GatherGoMascot
            variant={showCarpoolSignal ? "empty" : "idle"}
            size={62}
            showBadge={false}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              tw`absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-[#01082E] bg-[#FFD76A]`,
              {
                opacity: feedOpacity,
                transform: [{ scale: feedScale }]
              }
            ]}
          >
            <Ionicons name="flame-outline" size={16} color="#01082E" />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              tw`absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-[#01082E] bg-[#0FF1CF]`,
              {
                opacity: carpoolOpacity,
                transform: [{ scale: carpoolScale }]
              }
            ]}
          >
            <Ionicons name="car-sport-outline" size={16} color="#01082E" />
          </Animated.View>
        </View>

        {unreadCount > 0 ? (
          <View
            style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[20px] h-5 px-1 items-center justify-center`}
          >
            <Text style={tw`text-white text-xs font-bold`}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        ) : null}
      </AnimatedTouchable>
    </Animated.View>
  );
}
