import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import { useUpdateCarpool } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import { showGlobalError, showGlobalWarning } from "@/utils/globalErrorHandler";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircleWarning } from "lucide-react-native";
import { Text, View } from "react-native";
import tw from "twrnc";

export type FlexrideBSRef = {
  open: () => void;
  close: () => void;
};

export type FlexrideProps = {
  carpoolId: string;
};

const FlexrideBS = forwardRef<FlexrideBSRef, FlexrideProps>(
  ({ carpoolId }, ref) => {
    const queryClient = useQueryClient();
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
          showGlobalError("error saving description");
        },
      }
    );

    const snapPointsCar = useMemo(() => ["70%"], []);

    const [carModel, setCarModel] = useState("");
    const [carColor, setCarColor] = useState("");

    const saveDescription = () => {
      if (carModel.trim().length > 0 && carColor.trim().length > 0) {
        mutateAsync({ description: carModel + "$" + carColor });
      } else {
        showGlobalWarning("fill both model and color");
      }
    };

    const bottomSheetCarRef = useRef<BottomSheetModal>(null);

    // expose functions to parent
    useImperativeHandle(ref, () => ({
      open: () => bottomSheetCarRef.current?.snapToIndex(0),
      close: () => bottomSheetCarRef.current?.close(),
    }));

    return (
      <BottomSheet
        ref={bottomSheetCarRef}
        index={-1}
        snapPoints={snapPointsCar}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: 120,
          }}
        >
          <View style={tw`py-5 gap-5`}>
            <CustomView>
              <Text style={tw`text-white mb-1`}>Car model</Text>
              <Input
                style={tw`h-12`}
                placeholder="E.g., Benz GLE"
                onChangeText={setCarModel}
                value={carModel}
              />
            </CustomView>

            <CustomView>
              <Text style={tw`text-white mb-1`}>Color</Text>
              <Input
                style={tw`h-12`}
                placeholder="E.g., Wine red"
                onChangeText={setCarColor}
                value={carColor}
              />
            </CustomView>
            <View style={tw`gap-3 flex-row items-center`}>
              <MessageCircleWarning color={"red"} />
              <Text style={tw`text-red-600`}>
                Please dont input your plate number
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>

        <View style={tw`w-screen max-w-[500px] p-5`}>
          <CustomButton
            title={isCarpoolUpdating ? "Flexing ride" : "Save details"}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
            onPress={saveDescription}
            disabled={isCarpoolUpdating}
          />
        </View>
      </BottomSheet>
    );
  }
);

FlexrideBS.displayName = "FlexrideBS";

export default FlexrideBS;
