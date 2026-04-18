import { useLockedRouter } from "@/utils/navigation";
import { useRef } from "react";
import { Animated, Dimensions, Text, View } from "react-native";
import Slide from "./Slide";
import { slides } from "./slides";

const { width, height } = Dimensions.get("window");

export default function Onboarding() {
  const router = useLockedRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View className="flex-1 bg-[#01082E] ">
      {/* Slider */}
      <Animated.FlatList
        data={slides}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View
            style={{ width , height }}
            className="items-center justify-center"
          >
            <Slide
              artwork={item.artwork}
              eyebrow={item.eyebrow}
              title={item.title}
              description={item.description}
              proofLine={item.proofLine}
              chips={item.chips}
              actionCards={item.actionCards}
              stats={item.stats}
              accentFrom={item.accentFrom}
              accentTo={item.accentTo}
              buttonText={item.buttonText}
              showSwipeCue={index < slides.length - 1}
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
      <View className="absolute bottom-7 left-0 right-0 items-center">
        <View
          style={{
            backgroundColor: "rgba(7, 22, 79, 0.9)",
            borderColor: "#183379",
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 10,
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "#C5D0F7", fontSize: 12, fontWeight: "700" }}>
              Impact Journey
            </Text>
            <View className="flex-row justify-center ml-3">
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
        </View>
      </View>
    </View>
  );
}
