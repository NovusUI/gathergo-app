import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Share2 } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export type ShareRideBSRef = {
  open: () => void;
  close: () => void;
};

const ShareRideLinkBS = forwardRef<ShareRideBSRef>((_, ref) => {
  const snapPoints = useMemo(() => ["40%"], []);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // expose functions to parent
  useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.snapToIndex(1),
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
      backgroundStyle={tw.style("bg-[#01082E]")}
    >
      <BottomSheetScrollView style={tw`p-5`}>
        <View style={tw`flex-1 items-center justify-center px-5`}>
          {/* Fun emoji header */}
          <Text style={tw`text-4xl mb-2`}>🎉</Text>
          <Text style={tw`text-white text-xl font-bold`}>
            Share ride with a friend
          </Text>
          <Text style={tw`text-[#ADADAD] text-sm mt-1 mb-6 text-center`}>
            Send them your link and make the journey more fun together!
          </Text>

          {/* Share button */}
          <TouchableOpacity
            onPress={() => {}}
            style={tw`flex-row items-center gap-2 bg-[#0FF1CF] px-6 py-3 rounded-2xl shadow-md`}
          >
            <Share2 color="#000" size={20} />
            <Text style={tw`text-black font-bold text-base`}>Share Ride</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default ShareRideLinkBS;
