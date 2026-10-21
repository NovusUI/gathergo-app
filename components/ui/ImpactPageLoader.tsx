import { GogoLoadingArtwork } from "@/components/ui/GogoLoadingArtwork";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import tw from "twrnc";

interface ImpactPageLoaderProps {
  title?: string;
  message?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ImpactPageLoader({
  title = "Mapping impact",
  message = "Gathering the people, place, and purpose.",
  compact = false,
  style,
}: ImpactPageLoaderProps) {
  const reducedMotion = useReducedMotionPreference();
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${message}`}
      accessibilityRole="progressbar"
      style={[
        styles.container,
        compact ? styles.compactContainer : styles.fullContainer,
        style,
      ]}
    >
      <GogoLoadingArtwork
        width={compact ? 144 : 180}
        animated={!reducedMotion}
      />
      <Text style={tw`mt-5 text-center text-xl font-bold text-white`}>
        {title}
      </Text>
      <Text
        style={tw`mt-2 max-w-[280px] text-center text-sm leading-6 text-[#AFC0E7]`}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#01082E",
    paddingHorizontal: 28,
  },
  fullContainer: {
    flex: 1,
  },
  compactContainer: {
    paddingVertical: 34,
  },
});
