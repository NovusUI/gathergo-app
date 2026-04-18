import RequestCard from "@/components/carpool/RequestCard";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { CheckCircle2, Clock3, Share2 } from "lucide-react-native";
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
    const bottomSheetRef = useRef<any>(null);
    const snapPoints = useMemo(() => ["72%"], []);

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
      open: () => bottomSheetRef.current?.snapToIndex(0),
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
          <View style={tw`py-5 gap-6`}>
            <View style={tw`rounded-[28px] border border-[#1B2A50] bg-[#07122E] px-5 py-5`}>
              <Text style={tw`text-xl font-semibold text-white`}>Ride requests</Text>
              <Text style={tw`mt-2 text-sm leading-5 text-[#A8BAE4]`}>
                Review who wants a seat, where they will join from, and any note
                they left for you before you decide.
              </Text>

              <View style={tw`mt-4 flex-row gap-3`}>
                <View style={tw`flex-1 rounded-2xl bg-[#0D1B44] px-4 py-3`}>
                  <View style={tw`flex-row items-center`}>
                    <Clock3 size={16} color="#BFD2FF" />
                    <Text style={tw`ml-2 text-xs uppercase tracking-[1px] text-[#7F93C0]`}>
                      Pending
                    </Text>
                  </View>
                  <Text style={tw`mt-2 text-lg font-semibold text-white`}>
                    {newRequest.length}
                  </Text>
                </View>

                <View style={tw`flex-1 rounded-2xl bg-[#0D1B44] px-4 py-3`}>
                  <View style={tw`flex-row items-center`}>
                    <CheckCircle2 size={16} color="#65F5C7" />
                    <Text style={tw`ml-2 text-xs uppercase tracking-[1px] text-[#7F93C0]`}>
                      Approved
                    </Text>
                  </View>
                  <Text style={tw`mt-2 text-lg font-semibold text-white`}>
                    {accepted.length}
                  </Text>
                </View>
              </View>
            </View>

            {newRequest.length > 0 && (
              <View style={tw`gap-4`}>
                <Text style={tw`text-xs uppercase tracking-[1px] text-[#7F93C0]`}>
                  Pending requests
                </Text>
                {newRequest.map((p: any) => (
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
                ))}
              </View>
            )}

            {accepted.length > 0 && (
              <View style={tw`gap-4`}>
                <Text style={tw`text-xs uppercase tracking-[1px] text-[#7F93C0]`}>
                  Approved riders
                </Text>
                {accepted.map((p: any) => (
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
                ))}
              </View>
            )}

            {combinedRequest.length === 0 && (
              <View style={tw`items-center rounded-[28px] border border-dashed border-[#24365E] bg-[#07122E] px-5 py-10`}>
                <Text style={tw`text-base font-semibold text-white`}>
                  No requests yet
                </Text>
                <Text style={tw`mt-2 text-center text-sm leading-5 text-[#9FB0D8]`}>
                  When people ask to join this ride, they will show up here.
                </Text>
              </View>
            )}
          </View>
        </BottomSheetScrollView>

        <View style={tw`w-screen max-w-[500px] p-5 gap-4`}>
          <TouchableOpacity
            onPress={handleShare}
            style={tw`flex-row justify-center items-center gap-2 rounded-[18px] border border-[#1B2A50] py-3`}
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
