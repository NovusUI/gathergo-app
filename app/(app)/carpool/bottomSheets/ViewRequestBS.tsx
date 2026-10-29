import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useAppTheme } from "@/hooks/useAppTheme";
import RequestCard from "@/components/carpool/RequestCard";
import type { CarpoolPassengerRequest } from "@/types/carpool";
import {
  CARPOOL_PREVIOUS_DECISION_LABELS,
  getCarpoolRequestState,
  isPreviousCarpoolDecision,
} from "@/utils/carpoolRequests";
import { useCarpoolShare } from "@/hooks/useCarpoolShare";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { CheckCircle2, Clock3, Share2 } from "lucide-react-native";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ViewRequestBSProps = {
  carpool: { id: string; passengers: CarpoolPassengerRequest[] };
  dummy?: string;
};

export type ViewRequestBSRef = {
  open: () => void;
  close: () => void;
};

const ViewRequestBS = forwardRef<ViewRequestBSRef, ViewRequestBSProps>(
  ({ carpool, dummy }, ref) => {
    const { tw, color } = useAppTheme();
    const layout = useResponsiveLayout({ hasTabNavigation: false });
    const sheetMargin = Math.max(0, (layout.availableWidth - 840) / 2);
    const bottomSheetRef = useRef<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const shortLink = useCarpoolShare(carpool.id, isOpen);
    const snapPoints = useMemo(() => ["72%"], []);

    const newRequest = carpool.passengers.filter(
      (passenger) => passenger.status === "PENDING",
    );
    const accepted = carpool.passengers.filter(
      (passenger) => passenger.status === "ACCEPTED",
    );
    const combinedRequest = [...newRequest, ...accepted];
    const history = carpool.passengers
      .filter(isPreviousCarpoolDecision)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    const sections = [
      { title: "Pending requests", requests: newRequest },
      { title: "Approved riders", requests: accepted },
    ];

    // expose methods to parent
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
        index={-1}
        ref={bottomSheetRef}
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
          <View style={tw`py-5 gap-6`}>
            <View
              style={tw`rounded-[28px] border border-border dark:border-[#1B2A50] bg-background dark:bg-[#07122E] px-5 py-5`}
            >
              <Text
                style={tw`text-xl font-semibold text-foreground dark:text-white`}
              >
                Ride requests
              </Text>

              <View style={tw`mt-4 flex-row gap-3`}>
                <View
                  style={tw`flex-1 rounded-2xl bg-surface dark:bg-[#0D1B44] px-4 py-3`}
                >
                  <View style={tw`flex-row items-center`}>
                    <Clock3 size={16} color={color("#BFD2FF", "secondary")} />
                    <Text
                      style={tw`ml-2 text-xs uppercase tracking-[1px] text-muted dark:text-[#7F93C0]`}
                    >
                      Pending
                    </Text>
                  </View>
                  <Text
                    style={tw`mt-2 text-lg font-semibold text-foreground dark:text-white`}
                  >
                    {newRequest.length}
                  </Text>
                </View>

                <View
                  style={tw`flex-1 rounded-2xl bg-surface dark:bg-[#0D1B44] px-4 py-3`}
                >
                  <View style={tw`flex-row items-center`}>
                    <CheckCircle2 size={16} color={color("#65F5C7", "info")} />
                    <Text
                      style={tw`ml-2 text-xs uppercase tracking-[1px] text-muted dark:text-[#7F93C0]`}
                    >
                      Approved
                    </Text>
                  </View>
                  <Text
                    style={tw`mt-2 text-lg font-semibold text-foreground dark:text-white`}
                  >
                    {accepted.length}
                  </Text>
                </View>
              </View>
            </View>

            {sections
              .filter((section) => section.requests.length > 0)
              .map((section) => (
                <View key={section.title} style={tw`gap-4`}>
                  <Text
                    style={tw`text-xs uppercase tracking-[1px] text-muted dark:text-[#7F93C0]`}
                  >
                    {section.title}
                  </Text>
                  {section.requests.map((p) => (
                    <RequestCard
                      status={p.status}
                      key={p.id}
                      name={p.user.username}
                      message={p.origin}
                      imageUrl={p.user.profilePicUrlTN}
                      estimatedDistance={p.estimatedDistance}
                      note={p.note}
                      carpoolId={p.carpoolId}
                      requestId={p.id}
                      isFollowingRequester={p.isFollowingRequester}
                      isFollowedByRequester={p.isFollowedByRequester}
                      previousDecision={
                        getCarpoolRequestState(carpool.passengers, p.userId)
                          .previousDecision?.status ?? null
                      }
                    />
                  ))}
                </View>
              ))}

            {history.length > 0 ? (
              <View style={tw`gap-4`}>
                <Text
                  style={tw`text-xs uppercase tracking-[1px] text-muted dark:text-[#7F93C0]`}
                >
                  Previous requests
                </Text>
                {history.map((request) => (
                  <View
                    key={request.id}
                    style={tw`rounded-2xl border border-border dark:border-[#1B2A50] bg-surface dark:bg-[#07143B] p-4 gap-1`}
                  >
                    <Text
                      style={tw`font-semibold text-foreground dark:text-white`}
                    >
                      {request.user.username === null
                        ? "Ride member"
                        : `@${request.user.username}`}
                    </Text>
                    <Text style={tw`text-sm text-warning dark:text-[#F8D05C]`}>
                      {CARPOOL_PREVIOUS_DECISION_LABELS[request.status]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {combinedRequest.length === 0 && history.length === 0 && (
              <View
                style={tw`items-center rounded-[28px] border border-dashed border-border dark:border-[#24365E] bg-background dark:bg-[#07122E] px-5 py-10`}
              >
                <Text
                  style={tw`text-base font-semibold text-foreground dark:text-white`}
                >
                  No requests yet
                </Text>
                <Text
                  style={tw`mt-2 text-center text-sm leading-5 text-secondary dark:text-[#9FB0D8]`}
                >
                  When people ask to join this ride, they will show up here.
                </Text>
              </View>
            )}
          </View>
        </BottomSheetScrollView>

        <View style={tw`w-full max-w-[800px] self-center p-5 gap-4`}>
          <TouchableOpacity
            onPress={shortLink.share}
            disabled={shortLink.isPending}
            style={tw`flex-row justify-center items-center gap-2 rounded-[18px] border border-border dark:border-[#1B2A50] py-3`}
          >
            <Share2 size={18} color={color("#0FF1CF", "accent")} />
            <Text style={tw`text-accent dark:text-[#0FF1CF] font-medium`}>
              {shortLink.isPending
                ? "Preparing link…"
                : shortLink.isError
                  ? "Retry link"
                  : "Share ride with friend"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  },
);

ViewRequestBS.displayName = "ViewRequestBS";

export default ViewRequestBS;
