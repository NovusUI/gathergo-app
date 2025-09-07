import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  Animated,
  Dimensions,
  View,
} from "react-native";
import Slide from "./Slide";
import { slides } from "./slides";

const { width, height } = Dimensions.get("window");

export default function Onboarding() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  return (
    <View className="flex-1 bg-[#01082E] ">
      {/* Slider */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View
            style={{ width , height }}
            className="items-center justify-center"
          >
            <Slide
              image={item.image}
              title={item.title}
              description={item.description}
              showButton={item.showButton}
              onPress={() => router.replace("/login")}
            />
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* Pagination Dots */}
      <View className="absolute bottom-12 left-0 right-0 flex-row justify-center">
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: "clamp",
          });

          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: ["#FFFFFF", "#0FF1CF", "#FFFFFF"],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={i}
              style={{
                width: dotWidth,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                opacity,
                backgroundColor,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
