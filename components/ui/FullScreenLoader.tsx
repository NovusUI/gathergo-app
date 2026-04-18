import ActivityIndicator from "@/components/ui/AppLoader";
import { Text, View } from "react-native";
import tw from "twrnc";

interface FullScreenLoaderProps {
  title?: string;
  message?: string;
}

export default function FullScreenLoader({
  title = "Loading GatherGo",
  message = "Please hold on while we get things ready.",
}: FullScreenLoaderProps) {
  return (
    <View style={tw`flex-1 items-center justify-center bg-[#01082E] px-8`}>
      <View style={tw`items-center rounded-[28px] bg-[#101C45] px-8 py-10`}>
        <ActivityIndicator tone="accent" size="large" />
        <Text style={tw`mt-5 text-center text-xl font-semibold text-white`}>
          {title}
        </Text>
        <Text style={tw`mt-2 text-center text-sm leading-6 text-[#A8BAE4]`}>
          {message}
        </Text>
      </View>
    </View>
  );
}
