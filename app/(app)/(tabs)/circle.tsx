import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import { useLockedRouter } from "@/utils/navigation";
import { ScrollView, View } from "react-native";
import tw from "twrnc";

export default function CircleScreen() {
  const router = useLockedRouter();

  return (
    <View style={tw`flex-1 bg-[#030A31] pt-10 px-5`}>
      <CustomeTopBarNav
        title="Circle"
        onClickBack={() => router.replace("/")}
      />
      <ScrollView
        contentContainerStyle={tw`grow items-center justify-center pb-24`}
        showsVerticalScrollIndicator={false}
      >
        <MascotMoment
          artwork="comingSoon"
          layout="stacked"
          title="Your Circle is on its way"
          message="I'm getting this space ready for your communities. Come back soon to find your people."
        />
      </ScrollView>
    </View>
  );
}
