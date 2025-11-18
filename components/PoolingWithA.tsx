import { Text, View } from "react-native";
import tw from "twrnc";

import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import { EventDetails } from "./ui/EventDetails";

export default function PoolingWithA({
  description,
  owner,
  openSheet,
}: {
  description: string;
  owner: boolean;
  openSheet: () => void;
}) {
  const carpool = {
    carModel: description ? description.split("$")[0] : null,
    carColor: description ? description.split("$")[1] : null,
  };

  return (
    <CustomView className="px-5 gap-5 w-full">
      <Text style={tw`text-lg text-white`}>Pooling with a</Text>

      {carpool?.carModel && carpool?.carColor ? (
        <>
          <EventDetails title="Car model" subtitle={carpool?.carModel} />
          <EventDetails title="Color" subtitle={carpool?.carColor} />
        </>
      ) : (
        <View
          style={tw`gap-3 p-4 rounded-2xl bg-[#1B2A50]/30 border border-dashed border-[#31C6F6]`}
        >
          {owner ? (
            <>
              <Text style={tw`text-white text-base`}>🚗 Sample</Text>
              <EventDetails title="Car model" subtitle="Benz GLE (sample)" />
              <EventDetails title="Color" subtitle="Wine (sample)" />
              <CustomButton
                title="Flex your ride 🚘✨"
                onPress={openSheet}
                buttonClassName="bg-[#0FF1CF] border-0 mt-3"
                textClassName="!text-black"
                showArrow={false}
              />
              <Text style={tw`text-[#ADADAD] italic mt-1 text-sm`}>
                Make your car part of the vibe.
              </Text>
            </>
          ) : (
            <Text style={tw`text-[#ADADAD] italic mt-2`}>
              Pooler hasn’t flexed their ride yet 😉
            </Text>
          )}
        </View>
      )}
    </CustomView>
  );
}
