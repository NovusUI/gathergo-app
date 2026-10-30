import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useAppTheme } from "@/hooks/useAppTheme";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCarpoolShare } from "@/hooks/useCarpoolShare";
import { Share2 } from "lucide-react-native";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Text, TouchableOpacity, View } from "react-native";

export type ShareRideBSRef = {
  open: () => void;
  close: () => void;
};

interface ShareRideLinkBSProps {
  carpoolId?: string | null;
}

const ShareRideLinkBS = forwardRef<ShareRideBSRef, ShareRideLinkBSProps>(
  ({ carpoolId }, ref) => {
    const { tw, color } = useAppTheme();
    const layout = useResponsiveLayout({ hasTabNavigation: false });
    const sheetMargin = Math.max(0, (layout.availableWidth - 680) / 2);
    const snapPoints = useMemo(() => ["40%"], []);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [isOpen, setIsOpen] = useState(false);
    const shortLink = useCarpoolShare(carpoolId ?? "", isOpen);

    // expose functions to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        setIsOpen(true);
        bottomSheetRef.current?.snapToIndex(0);
      },
      close: () => {
        setIsOpen(false);
        bottomSheetRef.current?.close();
      },
    }));

    return (
      <BottomSheet
        topInset={layout.insets.top}
        containerStyle={{ marginHorizontal: sheetMargin }}
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={(index) => setIsOpen(index >= 0)}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={tw`bg-background dark:bg-[#01082E]`}
      >
        <BottomSheetScrollView style={tw`p-5`}>
          <View style={tw`flex-1 items-center justify-center px-5`}>
            {/* Fun emoji header */}
            <Text style={tw`text-4xl mb-2`}>🎉</Text>
            <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>
              Share ride with a friend
            </Text>
            <Text
              style={tw`text-muted dark:text-[#ADADAD] text-sm mt-1 mb-6 text-center`}
            >
              Send them your link and make the journey more fun together!
            </Text>

            {/* Share button */}
            <TouchableOpacity
              onPress={shortLink.share}
              disabled={shortLink.isPending || !carpoolId}
              accessibilityRole="button"
              accessibilityState={{
                disabled: shortLink.isPending || !carpoolId,
              }}
              style={tw`flex-row items-center gap-2 bg-accentFill dark:bg-[#0FF1CF] px-6 py-3 rounded-2xl shadow-md`}
            >
              <Share2 color={color("#01082E", "onAccent")} size={20} />
              <Text
                style={tw`text-onAccent dark:text-[#01082E] font-bold text-base`}
              >
                {shortLink.isPending
                  ? "Preparing link…"
                  : shortLink.isError
                    ? "Retry link"
                    : "Share Ride"}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

ShareRideLinkBS.displayName = "ShareRideLinkBS";

export default ShareRideLinkBS;
