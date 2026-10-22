import CustomButton from "@/components/buttons/CustomBtn1";
import SkipOnboardingButton from "@/components/buttons/SkipOnboardingButton";
import GogoWelcomeScreen from "@/components/ui/GogoWelcomeScreen";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { useOnboardingStore } from "@/store/onboarding";
import { useLockedRouter } from "@/utils/navigation";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  FlatList,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slide from "./Slide";
import { slides } from "./slides";

export default function Onboarding() {
  const router = useLockedRouter();
  const { hasSeenWelcome, completeWelcome } = useOnboardingStore();
  const finishOnboarding = () => {
    if (!hasSeenWelcome) completeWelcome();
    router.replace("/login");
  };

  if (!hasSeenWelcome) {
    return (
      <GogoWelcomeScreen
        onContinue={completeWelcome}
        onSkip={finishOnboarding}
      />
    );
  }

  return <OnboardingSlides onFinish={finishOnboarding} />;
}

function OnboardingSlides({ onFinish }: { onFinish: () => void }) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotionPreference();
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const lastSlide = activeIndex === slides.length - 1;

  const goToSlide = useCallback(
    (index: number) => {
      listRef.current?.scrollToIndex({ index, animated: !reducedMotion });
      setActiveIndex(index);
    },
    [reducedMotion],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (lastSlide || dragging || appState !== "active") return;
      const timer = setTimeout(() => goToSlide(activeIndex + 1), 5000);
      return () => clearTimeout(timer);
    }, [activeIndex, appState, dragging, goToSlide, lastSlide]),
  );

  const next = () => {
    if (lastSlide) onFinish();
    else goToSlide(activeIndex + 1);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#01082E" />
      <View style={styles.header}>
        <SkipOnboardingButton onPress={onFinish} />
      </View>
      <FlatList
        ref={listRef}
        style={styles.pager}
        data={slides}
        extraData={activeIndex}
        keyExtractor={(item) => item.artwork}
        renderItem={({ item, index }) => (
          <View style={{ width, flex: 1 }}>
            <Slide {...item} active={index === activeIndex} />
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onLayout={() =>
          listRef.current?.scrollToIndex({
            index: activeIndex,
            animated: false,
          })
        }
        onScrollBeginDrag={() => setDragging(true)}
        onScrollEndDrag={() => setDragging(false)}
        onMomentumScrollEnd={(event) => {
          setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
          setDragging(false);
        }}
      />
      <View style={styles.footer}>
        <View
          accessible
          accessibilityLabel={`Page ${activeIndex + 1} of ${slides.length}`}
          style={styles.pagination}
        >
          {slides.map((slide, index) => (
            <View
              key={slide.artwork}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
        <CustomButton
          onPress={next}
          title={lastSlide ? "Get started" : "Next"}
          buttonClassName="w-full self-center bg-[#0FF1CF] border-0"
          textClassName="text-[#01082E] mr-0"
          showArrow={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#01082E",
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  pager: {
    flex: 1,
  },
  footer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 468,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#455780",
  },
  activeDot: {
    width: 20,
    backgroundColor: "#0FF1CF",
  },
});
