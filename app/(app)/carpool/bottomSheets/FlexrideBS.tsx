import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import {
  CARPOOL_VEHICLE_OPTIONS,
  getCarpoolVehicleOption,
  type CarpoolVehicleIconKey,
} from "@/constants/carpool";
import CustomButton from "@/components/buttons/CustomBtn1";
import { useUpdateCarpool } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import { showGlobalError, showGlobalWarning } from "@/utils/globalErrorHandler";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import tw, { style as twStyle } from "twrnc";

export type FlexrideBSRef = {
  open: () => void;
  close: () => void;
};

export type FlexrideProps = {
  carpoolId: string;
  vehicleIcon?: string | null;
};

const FlexrideBS = forwardRef<FlexrideBSRef, FlexrideProps>(
  ({ carpoolId, vehicleIcon }, ref) => {
    const queryClient = useQueryClient();
    const [selectedIcon, setSelectedIcon] = useState<
      CarpoolVehicleIconKey | null
    >((vehicleIcon as CarpoolVehicleIconKey | null) ?? null);
    const currentVehicle = getCarpoolVehicleOption(selectedIcon);
    const snapPoints = useMemo(() => ["84%"], []);
    const bottomSheetCarRef = useRef<BottomSheet>(null);

    useEffect(() => {
      setSelectedIcon((vehicleIcon as CarpoolVehicleIconKey | null) ?? null);
    }, [vehicleIcon]);

    const { mutateAsync, isPending: isCarpoolUpdating } = useUpdateCarpool(
      carpoolId,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
          });

          bottomSheetCarRef.current?.close();
        },
        onError: () => {
          showGlobalError("Couldn't save ride vibe");
        },
      }
    );

    const saveRideVibe = async () => {
      if (!selectedIcon) {
        showGlobalWarning("Choose a ride icon first");
        return;
      }

      await mutateAsync({ vehicleIcon: selectedIcon });
    };

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetCarRef.current?.snapToIndex(0),
      close: () => bottomSheetCarRef.current?.close(),
    }));

    return (
      <BottomSheet
        ref={bottomSheetCarRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: "#041130" }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 180,
          }}
        >
          <View style={tw`gap-5`}>
            <View style={tw`gap-2`}>
              <Text style={tw`text-2xl font-semibold text-white`}>
                Flex your ride
              </Text>
              <Text style={tw`text-sm leading-5 text-[#A8BAE4]`}>
                Pick the icon that best matches your vibe. It&apos;ll show up on
                your carpool cards so riders can spot your style faster.
              </Text>
            </View>

            <View style={tw`rounded-[28px] bg-[#0A173F] p-5`}>
              <View style={tw`h-16 w-16 self-start rounded-full bg-[#0FF1CF]/15 items-center justify-center`}>
                <Ionicons
                  name={currentVehicle?.iconName || "sparkles-outline"}
                  size={34}
                  color="#0FF1CF"
                />
              </View>
              <Text style={tw`mt-4 text-lg font-semibold text-white`}>
                {currentVehicle?.label || "No ride icon selected yet"}
              </Text>
              <Text style={tw`mt-2 text-sm leading-5 text-[#A8BAE4]`}>
                You can keep it normal with a city car, go dramatic with a
                pirate ship, or fully commit to the chaos with a moon buggy.
              </Text>
            </View>

            <View style={tw`flex-row flex-wrap gap-3`}>
              {CARPOOL_VEHICLE_OPTIONS.map((option) => {
                const isActive = selectedIcon === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.9}
                    onPress={() => setSelectedIcon(option.key)}
                    style={twStyle(
                      "w-[47%] rounded-[24px] border p-4",
                      isActive
                        ? "border-[#0FF1CF] bg-[#0FF1CF]/12"
                        : "border-[#24345A] bg-[#0A173F]"
                    )}
                  >
                    <View
                      style={twStyle(
                        "h-12 w-12 rounded-full items-center justify-center",
                        isActive ? "bg-[#0FF1CF]/18" : "bg-[#13214A]"
                      )}
                    >
                      <Ionicons
                        name={option.iconName}
                        size={24}
                        color={isActive ? "#0FF1CF" : "#9FB0D8"}
                      />
                    </View>
                    <Text
                      style={twStyle(
                        "mt-3 text-base font-semibold",
                        isActive ? "text-white" : "text-[#D7E2FF]"
                      )}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={twStyle(
                        "mt-1 text-xs",
                        isActive ? "text-[#B9FFF4]" : "text-[#7F93C2]"
                      )}
                    >
                      {isActive ? "Selected" : "Tap to choose"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </BottomSheetScrollView>

        <View style={tw`w-screen max-w-[500px] p-5`}>
          <CustomButton
            title={isCarpoolUpdating ? "Saving vibe" : "Save ride vibe"}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
            onPress={saveRideVibe}
            disabled={isCarpoolUpdating}
          />
        </View>
      </BottomSheet>
    );
  }
);

FlexrideBS.displayName = "FlexrideBS";

export default FlexrideBS;
