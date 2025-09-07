
import CustomButton from "@/components/buttons/CustomBtn1";
import { Image, Text, View } from "react-native";
import "../../../global.css";

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
    <View className="flex-1 bg-[#01082E] justify-center items-center px-5">
      {/* Image */}
      <Image source={image} className="w-[250px] h-[250px] mb-10" resizeMode="contain" />

      {/* Title */}
      <Text className="text-white text-2xl font-bold mb-2">{title}</Text>

      {/* Description */}
      <Text className="text-gray-400 text-sm text-center leading-5 mb-8">
        {description}
      </Text>

     

      {/* Get Started Button */}
      {showButton && (
        // <TouchableOpacity
        //   className="flex-row justify-center items-center border border-white rounded-xl  p-5 w-3/4 max-w-96"
        //   onPress={onPress}
        // >
        //   <Text className="text-white font-bold mr-2">GET STARTED</Text>
        //   <Text className="text-white text-lg absolute right-5">→</Text>
        // </TouchableOpacity>
        <CustomButton onPress={onPress} title="get started" arrowCircleColor="bg-transperent border-white border-[1px]"/>
      )}
    </View>
  );
}
