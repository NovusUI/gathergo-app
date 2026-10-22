import {
  FEED_FRENZY_COLORS,
  FEED_FRENZY_LABELS,
  type FeedFrenzyLevel
} from "@/constants/feedFrenzy";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { GogoFrenzyArtwork } from "@/components/gogo/mascot/GogoFrenzyArtwork";
import { GogoCarFrenzyArtwork } from "@/components/gogo/mascot/GogoCarFrenzyArtwork";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
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
  frenzyLevel: FeedFrenzyLevel;
  onPress: () => void;
  disabled?: boolean;
  supportsCarpool?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
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
  frenzyLevel,
  onPress,
  disabled = false,
  supportsCarpool = false
}: FlameFeedButtonProps) {
  const reducedMotion = useReducedMotionPreference();
  const heatColor = FEED_FRENZY_COLORS[frenzyLevel][0];
  const Artwork = supportsCarpool ? GogoCarFrenzyArtwork : GogoFrenzyArtwork;
  const { width, height } = useWindowDimensions();
  const maxX = Math.max(SIDE_INSET, width - BUTTON_SIZE - SIDE_INSET);
  const maxY = Math.max(TOP_INSET, height - BUTTON_SIZE - BOTTOM_INSET);
  const pulse = useRef(new Animated.Value(1)).current;
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

      if (reducedMotion) {
        position.setValue(nextPosition);
        return;
      }
      Animated.spring(position, {
        toValue: nextPosition,
        friction: 7,
        tension: 90,
        useNativeDriver: true
      }).start();
    },
    [position, reducedMotion]
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
    const prevUnread = previousUnreadRef.current;
    previousUnreadRef.current = unreadCount;

    pulse.stopAnimation();
    pulse.setValue(1);
    if (unreadCount > prevUnread && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (unreadCount <= 0 || reducedMotion || disabled) return;

    const animation = Animated.sequence([
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
    ]);
    animation.start();

    return () => animation.stop();
  }, [disabled, pulse, reducedMotion, unreadCount]);

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
          supportsCarpool
            ? "Open live feed and carpool companion"
            : "Open live feed"
        }
        accessibilityValue={{
          text: `${FEED_FRENZY_LABELS[frenzyLevel]}. ${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}.`
        }}
        accessibilityHint="Tap to open the feed. Drag to move this button."
        style={[
          tw`relative items-center justify-center rounded-full border bg-[#041130]/90 p-1`,
          {
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderColor: `${heatColor}66`,
            transform: [{ scale: pulse }]
          }
        ]}
      >
        {unreadCount > 0 ? (
          <View
            pointerEvents="none"
            style={[
              tw`absolute inset-0 rounded-full`,
              { backgroundColor: `${heatColor}1A`, opacity: 0.16 }
            ]}
          />
        ) : null}
        <View style={tw`h-[66px] w-[66px] items-center justify-center`}>
          <View
            pointerEvents="none"
            style={{ transform: [{ translateY: supportsCarpool ? 0 : -5 }] }}
          >
            <Artwork
              level={frenzyLevel}
              size={supportsCarpool ? 96 : 88}
              animated={!disabled && !reducedMotion}
            />
          </View>
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
