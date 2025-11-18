import CustomButton from "@/components/buttons/CustomBtn1";
import { Image, Text, View } from "react-native";
import tw from "twrnc";

type OnboardingSlideProps = {
  image: any;
  title: string;
  description: string;
  onPress: () => void;
  showButton?: boolean;
};

export default function OnboardingSlide({
  image,
  title,
  description,
  onPress,
  showButton = false,
}: OnboardingSlideProps) {
  return (
    <View style={tw`flex-1 bg-[#01082E] justify-center items-center px-5`}>
      {/* Image */}
      <Image
        source={image}
        resizeMode="contain"
        style={tw.style(`mb-10`, { width: 250, height: 250 })}
      />

      {/* Title */}
      <Text style={tw`text-white text-2xl font-bold mb-2`}>{title}</Text>

      {/* Description */}
      <Text style={tw`text-gray-400 text-sm text-center leading-5 mb-8`}>
        {description}
      </Text>

      {showButton && (
        <CustomButton
          onPress={onPress}
          title="get started"
          arrowCircleColor={`bg-transparent border-white border`}
        />
      )}
    </View>
  );
}
