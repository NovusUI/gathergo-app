import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import GgCircleArtwork from "@/components/ui/GgCircleArtwork";
import { useLockedRouter } from "@/utils/navigation";
import { Sparkles, Users } from "lucide-react-native";
import { Text, View } from "react-native";
import tw from "twrnc";

export default function CircleScreen() {
  const router = useLockedRouter();

  return (
    <View style={tw`flex-1 bg-[#030A31] pt-10 px-5`}>
      <CustomeTopBarNav title="Circle" onClickBack={() => router.replace("/")} />

      <View style={tw`w-full max-w-[500px] self-center flex-1 items-center justify-center`}>
        <GgCircleArtwork width={260} height={180} />

        <View style={tw`mt-6 bg-[#101C45] border border-[#22306B] rounded-2xl p-5 w-full`}>
          <View style={tw`flex-row items-center mb-3`}>
            <Users color="#0FF1CF" size={18} />
            <Text style={tw`text-[#0FF1CF] font-semibold ml-2`}>Circle is coming soon</Text>
          </View>

          <Text style={tw`text-white text-lg font-bold mb-2`}>
            Communities are almost ready
          </Text>
          <Text style={tw`text-gray-300 text-sm`}>
            We are building social circles for event communities, shared updates,
            and private interactions around your activities.
          </Text>

          <View style={tw`flex-row items-center mt-4`}>
            <Sparkles size={14} color="#8FA5E2" />
            <Text style={tw`text-[#8FA5E2] text-xs ml-2`}>
              Early preview will appear here soon.
            </Text>
          </View>
        </View>

        <View style={tw`w-full mt-6`}>
          <CustomButton
            title="Back to home"
            onPress={() => router.replace("/")}
            buttonClassName="bg-[#0FF1CF] border-0 w-full"
            textClassName="!text-black"
            arrowCircleColor="bg-[#0C7F7F]"
            showArrow
          />
        </View>
      </View>
    </View>
  );
}
