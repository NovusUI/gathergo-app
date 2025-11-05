import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Share2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

export type ShareRideBSRef = {
  open: () => void;
  close: () => void;
};

const ShareRideLinkBS = forwardRef<ShareRideBSRef>((_, ref) => {
  const snapPoints = useMemo(() => ["40%"], []);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // expose functions to parent
  useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.snapToIndex(1), // or snapToIndex(0)
    close: () => bottomSheetRef.current?.close(),
  }));

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
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
        <View className="flex-1 items-center justify-center px-5">
          {/* Fun emoji header */}
          <Text className="text-4xl mb-2">🎉</Text>
          <Text className="text-white text-xl font-bold">
            Share ride with a friend
          </Text>
          <Text className="text-[#ADADAD] text-sm mt-1 mb-6 text-center">
            Send them your link and make the journey more fun together!
          </Text>

          {/* Share button */}
          <TouchableOpacity
            onPress={() => {}}
            className="flex-row items-center gap-2 bg-[#0FF1CF] px-6 py-3 rounded-2xl shadow-md"
          >
            <Share2 color="#000" size={20} />
            <Text className="text-black font-bold text-base">Share Ride</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default ShareRideLinkBS;
