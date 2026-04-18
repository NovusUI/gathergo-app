import { Ionicons } from "@expo/vector-icons";
import {
  getCarpoolPassengerMessage,
  getCarpoolVehicleOption,
} from "@/constants/carpool";
import { Text, View } from "react-native";
import tw from "twrnc";

import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import { EventDetails } from "./ui/EventDetails";

export default function PoolingWithA({
  description,
  vehicleIcon,
  owner,
  openSheet,
}: {
  description?: string | null;
  vehicleIcon?: string | null;
  owner: boolean;
  openSheet: () => void;
}) {
  const selectedVehicle = getCarpoolVehicleOption(vehicleIcon);
  const carpool = {
    carModel: description ? description.split("$")[0] : null,
    carColor: description ? description.split("$")[1] : null,
  };
  const riderCopy = selectedVehicle
    ? getCarpoolPassengerMessage(selectedVehicle.key)
    : getCarpoolPassengerMessage();

  return (
    <CustomView className="px-5 gap-5 w-full">
      <Text style={tw`text-lg text-white`}>Ride vibe</Text>

      {selectedVehicle ? (
        <View style={tw`gap-4 rounded-[28px] bg-[#101C45] p-5`}>
          <View style={tw`h-16 w-16 self-start rounded-full bg-[#0FF1CF]/15 items-center justify-center`}>
            <Ionicons
              name={selectedVehicle.iconName}
              size={34}
              color="#0FF1CF"
            />
          </View>
          <View style={tw`gap-2`}>
            <Text style={tw`text-xl font-semibold text-white`}>
              {selectedVehicle.label}
            </Text>
            <Text style={tw`text-sm leading-5 text-[#A8BAE4]`}>
              {owner
                ? "Riders will see this icon on your carpool card and in the ride details."
                : riderCopy}
            </Text>
          </View>
          {owner && (
            <CustomButton
              title="Change ride vibe"
              onPress={openSheet}
              buttonClassName="bg-[#0FF1CF] border-0 mt-1"
              textClassName="!text-black"
              showArrow={false}
            />
          )}
        </View>
      ) : carpool?.carModel && carpool?.carColor ? (
        <View style={tw`gap-4 rounded-[28px] bg-[#101C45] p-5`}>
          <>
            <EventDetails title="Car model" subtitle={carpool?.carModel} />
            <EventDetails title="Color" subtitle={carpool?.carColor} />
          </>
          {owner && (
            <CustomButton
              title="Add ride icon"
              onPress={openSheet}
              buttonClassName="bg-[#0FF1CF] border-0 mt-1"
              textClassName="!text-black"
              showArrow={false}
            />
          )}
        </View>
      ) : (
        <View
          style={tw`gap-3 p-4 rounded-2xl bg-[#1B2A50]/30 border border-dashed border-[#31C6F6]`}
        >
          {owner ? (
            <>
              <Text style={tw`text-white text-base`}>
                Pick a ride icon riders can recognize
              </Text>
              <CustomButton
                title="Flex your ride"
                onPress={openSheet}
                buttonClassName="bg-[#0FF1CF] border-0 mt-3"
                textClassName="!text-black"
                showArrow={false}
              />
              <Text style={tw`text-[#ADADAD] italic mt-1 text-sm`}>
                Choose something fun like a sport car, spaceship, boat, or bicycle.
              </Text>
            </>
          ) : (
            <Text style={tw`text-[#ADADAD] italic mt-2`}>
              Pooler has not flexed their ride yet. When they do, it will show up here before pickup.
            </Text>
          )}
        </View>
      )}
    </CustomView>
  );
}
