import { ArrowRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface Props {
  title: string;
  value: string;
  onPress: () => void;
}

const CustomEventInfoSelector = ({ title, value, onPress }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`flex flex-row items-center justify-between p-5 bg-[#1B2A50]/40 rounded-2xl`}
    >
      <Text style={tw`text-white capitalize`}>{title}</Text>

      {!value && (
        <View style={tw`rounded-full p-2 bg-[#070E30]`}>
          <ArrowRight color="white" />
        </View>
      )}

      {Boolean(value) && (
        <Text style={tw`text-gray-300`}>
          {typeof value === "string" ? value : JSON.stringify(value)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default CustomEventInfoSelector;
