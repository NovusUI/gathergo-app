import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface Props {
  title: string;
  link: string;
  iconColor?: string;
  isCurrent?: boolean;
}

const Shortcut = ({
  title,
  link,
  iconColor = "#FF932E",
  isCurrent = false,
}: Props) => {
  const router = useRouter();

  const handlePress = () => {
    if (link.startsWith("events/")) {
      const eventId = link.split("/")[1];
      router.push(`/dashboard/${eventId}`);
    } else {
      router.replace(`/${link}`);
    }
  };

  return (
    <TouchableOpacity
      style={[
        tw`p-3 rounded-full gap-2 flex-row items-center min-w-[120px]`,
        isCurrent
          ? tw`border-2 border-[#F1D417] bg-[#1B2A50]`
          : tw`bg-[#1B2A50]`,
      ]}
      onPress={handlePress}
    >
      <View
        style={[
          tw`flex-row justify-center items-center w-8 h-8 rounded-full`,
          { backgroundColor: isCurrent ? "#F1D417" : iconColor },
        ]}
      >
        <Text style={tw`font-bold text-white capitalize`}>{title[0]}</Text>
      </View>
      <View style={tw`flex-1`}>
        <Text
          style={tw`text-white text-sm capitalize`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Shortcut;
