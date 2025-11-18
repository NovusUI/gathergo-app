import RequestCard from "@/components/carpool/RequestCard";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Share2 } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Share, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type ViewRequestBSProps = {
  carpool: any;
  dummy?: string;
};

export type ViewRequestBSRef = {
  open: () => void;
  close: () => void;
};

const ViewRequestBS = forwardRef<ViewRequestBSRef, ViewRequestBSProps>(
  ({ carpool, dummy }, ref) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["60%"], []);

    const newRequest =
      carpool?.passengers.filter(
        (passenger: any) => passenger.status === "PENDING"
      ) || [];
    const accepted =
      carpool?.passengers.filter(
        (passenger: any) => passenger.status === "ACCEPTED"
      ) || [];
    const combinedRequest = [...newRequest, ...accepted];

    // expose methods to parent
    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.snapToIndex(1),
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleShare = async () => {
      try {
        await Share.share({
          message: `🚗 Join my carpool 👉 https://yourapp.com/carpool/${carpool.id}`,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    };

    return (
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={tw`bg-[#01082E]`}
      >
        <BottomSheetScrollView style={tw`p-5`}>
          <View style={tw`py-5 gap-5`}>
            {combinedRequest.length > 0 ? (
              carpool.passengers.map((p: any) => (
                <RequestCard
                  status={p.status}
                  key={p.id}
                  name={p.user.username}
                  message={p.origin ?? "No location"}
                  imageUrl={p.user.profilePicUrlTN}
                  estimatedDistance={p.estimatedDistance}
                  note={p.note}
                  carpoolId={p.carpoolId}
                  requestId={p.id}
                />
              ))
            ) : (
              <Text style={tw`text-white`}>No requests yet</Text>
            )}
          </View>
        </BottomSheetScrollView>

        {/* Actions section */}
        <View style={tw`w-screen max-w-[500px] p-5 gap-4`}>
          <TouchableOpacity
            onPress={handleShare}
            style={tw`flex-row justify-center items-center gap-2 py-2 rounded-lg border border-[#1B2A50]`}
          >
            <Share2 size={18} color="#0FF1CF" />
            <Text style={tw`text-[#0FF1CF] font-medium`}>
              Share ride with friend
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  }
);

export default ViewRequestBS;
