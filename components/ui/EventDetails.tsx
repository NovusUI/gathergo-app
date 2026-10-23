import { useAppTheme } from "@/hooks/useAppTheme";
import { Text, View } from "react-native";

export const EventDetails = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  const { tw } = useAppTheme();
  return (
    <View style={tw`gap-2`}>
      <Text style={tw`capitalize text-muted dark:text-[#8E8E8E] text-sm`}>{title}</Text>
      <Text style={tw`text-foreground dark:text-white`}>{subtitle}</Text>
    </View>
  );
};
