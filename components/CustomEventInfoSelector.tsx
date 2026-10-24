import { useAppTheme } from "@/hooks/useAppTheme";
import { ArrowRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  value: string;
  onPress: () => void;
}

const CustomEventInfoSelector = ({ title, value, onPress }: Props) => {
  const { tw, color } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`flex flex-row items-center justify-between p-5 bg-surface dark:bg-[#1B2A50]/40 border border-borderStrong dark:border-transparent rounded-2xl`}
    >
      <Text style={tw`text-foreground dark:text-white capitalize`}>{title}</Text>

      {!value && (
        <View style={tw`rounded-full p-2 bg-background dark:bg-[#070E30]`}>
          <ArrowRight color={color("white", "foreground")} />
        </View>
      )}

      {Boolean(value) && (
        <Text style={tw`text-secondary dark:text-gray-300`}>
          {typeof value === "string" ? value : JSON.stringify(value)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default CustomEventInfoSelector;
