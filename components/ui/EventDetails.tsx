import { Text, View } from "react-native";
import tw from "twrnc";

export const EventDetails = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  return (
    <View style={tw`gap-2`}>
      <Text style={tw`capitalize text-[#8E8E8E] text-sm`}>{title}</Text>
      <Text style={tw`text-white`}>{subtitle}</Text>
    </View>
  );
};
