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
      open: () => bottomSheetCarRef.current?.snapToIndex(1), // or snapToIndex(0)
      close: () => bottomSheetCarRef.current?.close(),
    }));

    return (
      <BottomSheet
        ref={bottomSheetCarRef}
        index={-1}
        snapPoints={snapPointsCar}
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
        <BottomSheetScrollView className="p-5">
          <View className="py-5 gap-5">
            <CustomView>
              <Text className="text-white mb-1">Car model</Text>
              <Input
                className="h-16"
                placeholder="E.g., Benz GLE"
                onChangeText={setCarModel}
                value={carModel}
              />
            </CustomView>

            <CustomView>
              <Text className="text-white mb-1">Color</Text>
              <Input
                className="h-16"
                placeholder="E.g., Wine red"
                onChangeText={setCarColor}
                value={carColor}
              />
            </CustomView>
            <View className="gap-3 flex-row items-center">
              <MessageCircleWarning color={"red"} />
              <Text className="text-red-600">
                Please dont input your plate number
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>

        <View className="w-screen max-w-[500px] p-5">
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

export default FlexrideBS;
