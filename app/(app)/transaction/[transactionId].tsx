import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import QRCodeGenerator from "@/components/QRCodeGen";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import { EventDetails } from "@/components/ui/EventDetails";
import { useAuth } from "@/context/AuthContext";
import {
  useEventDetails,
  useTicketOrRegByTransactionRef,
  useTransactionRef,
} from "@/services/queries";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { safeGoBack } from "@/utils/navigation";
import { numberWithCommas } from "@/utils/utils";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  CarFront,
  CircleCheckIcon,
  CircleXIcon,
  Flame,
  LoaderIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import tw, { style as twStyle } from "twrnc";

const DashedLine = () => (
  <Svg height="2" width="100%">
    <Line
      x1="0"
      y1="0"
      x2="100%"
      y2="0"
      stroke="#3D50DF"
      strokeWidth="2"
      strokeDasharray="4,4" // pattern: dash, gap
    />
  </Svg>
);

const TransactionRef = () => {
  const router = useLockedRouter();
  const { transactionId: id, type: routeType } = useLocalSearchParams<{
    transactionId?: string | string[];
    type?: string | string[];
  }>();
  const transactionId = Array.isArray(id) ? id[0] : id;
  const routeTransactionType = (
    Array.isArray(routeType) ? routeType[0] : routeType
  )?.toUpperCase();

  const { user } = useAuth();
  const resolvedTransactionId = transactionId || "";

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["100"], []);

  const openSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const { data, isPending, isError } = useTransactionRef(resolvedTransactionId, {
    enabled: !!transactionId, // prevent running when no ID
    refetchInterval: (query: any) => {
      const status = String(query.state.data?.data?.status || "").toUpperCase();
      if (status === "AWAITING_TRANSFER") {
        return 5000;
      }
      return status === "PENDING" || status === "PROCESSING" ? 3000 : false;
    },
  });

  const transactionStatus = String(data?.data?.status || "").toUpperCase();
  const paymentProvider = String(data?.data?.paymentProvider || "").toUpperCase();
  const transactionType = (
    data?.data?.metadata?.type ||
    routeTransactionType ||
    "TICKET"
  ).toUpperCase();
  const isStatusSuccess = data?.data.status === "SUCCESS";
  const sponsorshipInfo = data?.data?.metadata?.sponsorship;
  const isSponsoredRegistration =
    isStatusSuccess &&
    transactionType === "REGISTRATION" &&
    sponsorshipInfo?.beneficiaryType === "SPONSORED";
  const isAwaitingTransfer = transactionStatus === "AWAITING_TRANSFER";
  const isFailedStatus = transactionStatus === "FAILED";
  const isProcessingStatus =
    isPending || transactionStatus === "PENDING" || transactionStatus === "PROCESSING";
  const isWaitingStatus = isAwaitingTransfer || isProcessingStatus;
  const isAlatTransfer = paymentProvider === "ALAT_TRANSFER";
  const hasTickets =
    !isSponsoredRegistration &&
    (transactionType === "TICKET" || transactionType === "REGISTRATION");

  const {
    data: TicketsOrReg,
  } = useTicketOrRegByTransactionRef(
    resolvedTransactionId,
    transactionType === "REGISTRATION" ? "REGISTRATION" : "TICKET",
    {
      enabled: !!transactionId && isStatusSuccess && hasTickets,
    }
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextCheckCountdown, setNextCheckCountdown] = useState(5);
  const [livePulseOn, setLivePulseOn] = useState(true);
  const tickets = TicketsOrReg?.data || [];
  const primaryTicket = tickets[currentIndex];
  const eventIdForCta = data?.data?.metadata?.eventId || primaryTicket?.event?.id;
  const { data: eventDetails } = useEventDetails(eventIdForCta || "", {
    enabled: isStatusSuccess && Boolean(eventIdForCta),
  });
  const isPhysicalEventForCta = eventDetails?.data?.isPhysicalEvent !== false;
  const eventTitleForCta =
    eventDetails?.data?.title || primaryTicket?.event?.title || "your event";
  const providerInstructions = data?.data?.metadata?.providerInstructions;
  const waitingRefreshCopy = isAwaitingTransfer
    ? "We’re checking your transfer automatically every 5 seconds."
    : "We’re processing your payment now and refreshing this page automatically.";
  const headlineCopy = isStatusSuccess
    ? transactionType === "DONATION"
      ? "Donation confirmed"
      : isSponsoredRegistration
        ? "Impact spot funded"
      : transactionType === "REGISTRATION"
        ? "Registration confirmed"
        : "Ticket purchase confirmed"
    : isAwaitingTransfer
      ? "Awaiting transfer confirmation"
      : isFailedStatus
        ? "Payment not confirmed"
        : "Payment in progress";

  const bodyCopy = isStatusSuccess
    ? transactionType === "DONATION"
      ? "Your support just powered this event forward. Thank you for donating."
      : isSponsoredRegistration
        ? "Your sponsored registration is paid for. The organizer will decide who receives the spot."
      : transactionType === "REGISTRATION"
        ? "You're officially in. Your event registration is complete."
        : "Your tickets are ready. You can open and scan them anytime."
    : isAwaitingTransfer
      ? hasTickets
        ? "We’re waiting for your bank transfer to be confirmed. Once it lands, this page will update and your pass will appear here."
        : "We’re waiting for your bank transfer to be confirmed. Once it lands, this page will update automatically."
      : isFailedStatus
        ? "We couldn’t confirm this payment. If you already made the transfer, give it a moment and check this page again."
        : "Your payment is still being processed. We’ll keep checking and update this page automatically.";
  const displayStatusLabel = isAwaitingTransfer
    ? "Awaiting transfer"
    : isFailedStatus
      ? "Failed"
      : isStatusSuccess
        ? "Success"
        : isProcessingStatus
          ? "Processing"
          : transactionStatus || "Pending";

  const handleNext = () => {
    if (currentIndex < tickets.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  useEffect(() => {
    if (isError) showGlobalError("Error in transaction");
  }, [isError]);

  useEffect(() => {
    if (!isAwaitingTransfer) {
      setNextCheckCountdown(5);
      setLivePulseOn(true);
      return;
    }

    setNextCheckCountdown(5);
    setLivePulseOn(true);

    const timer = setInterval(() => {
      setNextCheckCountdown((current) => (current <= 1 ? 5 : current - 1));
      setLivePulseOn((current) => !current);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAwaitingTransfer]);

  const goToEventFeed = useCallback(() => {
    if (eventIdForCta) {
      router.replace(`/event/${eventIdForCta}?openFeed=1`);
      return;
    }
    router.replace("/");
  }, [eventIdForCta, router]);

  return (
    <View
      style={tw`flex-1 pt-10 bg-[#01082E] flex flex-col items-center w-full`}
    >
      <CustomView style={tw`px-3`}>
        <CustomeTopBarNav
          title="Transaction ref"
          onClickBack={() => safeGoBack(router, "/")}
        />
      </CustomView>
      <ScrollView
        style={tw`w-full max-w-500 py-10 px-5`}
        contentContainerStyle={tw`pb-12`}
      >
        <View style={tw`px-4 py-8 bg-[#010E3A] rounded-lg gap-8`}>
          <View style={tw`flex-row justify-between gap-4 `}>
            {isStatusSuccess && !isPending && (
              <CircleCheckIcon size={70} color="#20C963" />
            )}
            {isFailedStatus && !isPending && (
              <CircleXIcon size={70} color="red" />
            )}
            {isWaitingStatus && (
              <LoaderIcon size={70} color="yellow" />
            )}
            <TouchableOpacity
              style={tw`gap-1 w-4/5`}
              onPress={isStatusSuccess && hasTickets ? openSheet : () => null}
            >
              <Text style={tw`text-white text-2xl`}>
                {displayStatusLabel}
              </Text>
              <Text style={tw`text-white text-xs mr-16`}>
                {bodyCopy}
              </Text>
              {isWaitingStatus ? (
                <Text style={tw`text-[#FFD76A] text-xs mr-16`}>
                  {waitingRefreshCopy}
                </Text>
              ) : null}
              {isStatusSuccess && hasTickets && tickets.length > 0 && (
                <Text style={tw`text-white text-xs mr-16`}>
                  TAP TO VIEW YOUR PASSES
                </Text>
              )}
              {isStatusSuccess && isSponsoredRegistration && (
                <Text style={tw`text-white text-xs mr-16`}>
                  THIS SPOT IS WAITING FOR CREATOR ASSIGNMENT
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View
            style={tw`border-[1px] border-white rounded-2xl py-5 px-8 gap-3`}
          >
            <Text style={tw`text-white`}>
              {transactionType === "DONATION"
                ? "Donation Details"
                : isSponsoredRegistration
                ? "Sponsored Registration"
                : transactionType === "REGISTRATION"
                ? "Registration Details"
                : "Ticket Details"}
            </Text>

            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-white`}>
                {transactionType === "DONATION" ? "Amount Donated:" : "Amount Paid:"}
              </Text>
              <Text style={tw`text-white text-ellipsis`}>
                {numberWithCommas(data?.data.amount/100, true, null)}
              </Text>
            </View>
            <Text style={tw`text-white`}>{headlineCopy}</Text>
            <Text style={tw`text-white`}>
              {isStatusSuccess
                ? isSponsoredRegistration
                  ? "The creator will allocate this spot to someone who needs it."
                  : "Thank you!"
                : isSponsoredRegistration
                  ? "The creator will allocate this spot to someone who needs it."
                : isAwaitingTransfer
                  ? "We’ll confirm it here as soon as the bank transfer settles."
                  : isFailedStatus
                    ? "You can try again or check back if the transfer was already made."
                    : "Hang tight while we keep checking."}
            </Text>
          </View>
        </View>
        {isAwaitingTransfer && isAlatTransfer ? (
          <View style={tw`mt-5 rounded-2xl border border-[#5A4718] bg-[#2A2209] overflow-hidden`}>
            <View style={tw`px-4 py-2.5 bg-[#FFD76A]`}>
              <Text style={tw`text-[#2A2209] text-xs font-bold tracking-widest uppercase`}>
                Transfer Pending
              </Text>
            </View>

            <View style={tw`px-4 py-5 gap-4`}>
              <Text style={tw`text-white text-lg font-bold`}>
                Waiting for your bank transfer
              </Text>
              <Text style={tw`text-[#F4E7B0] text-sm leading-6`}>
                If you’ve already sent the money, stay on this page. We’ll keep checking and update the status automatically.
              </Text>

              <View style={tw`flex-row items-center justify-between rounded-2xl bg-[#14102A] px-4 py-3`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <View
                    style={twStyle("h-2.5 w-2.5 rounded-full", {
                      backgroundColor: livePulseOn ? "#FFD76A" : "#7A6330",
                    })}
                  />
                  <Text style={tw`text-xs font-semibold uppercase tracking-wider text-[#FFD76A]`}>
                    Checking status
                  </Text>
                </View>
                <Text style={tw`text-xs font-semibold text-[#F4E7B0]`}>
                  Next check in {nextCheckCountdown}s
                </Text>
              </View>

              <View style={tw`rounded-2xl bg-[#14102A] p-4 gap-3`}>
                <View style={tw`flex-row justify-between gap-4`}>
                  <Text style={tw`text-[#B7A979] text-xs uppercase`}>Amount</Text>
                  <Text style={tw`text-white font-semibold`}>
                    {numberWithCommas(data?.data?.amount / 100, true, null)}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between gap-4`}>
                  <Text style={tw`text-[#B7A979] text-xs uppercase`}>Bank</Text>
                  <Text style={tw`text-white font-semibold`}>
                    {providerInstructions?.bankName || "Wema Bank"}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between gap-4`}>
                  <Text style={tw`text-[#B7A979] text-xs uppercase`}>Account name</Text>
                  <Text style={tw`flex-1 text-right text-white font-semibold`}>
                    {providerInstructions?.accountName || "GatherGo"}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between gap-4`}>
                  <Text style={tw`text-[#B7A979] text-xs uppercase`}>Account number</Text>
                  <Text style={tw`text-white text-base font-bold`}>
                    {providerInstructions?.accountNumber || "-"}
                  </Text>
                </View>
              </View>

              <View style={tw`rounded-2xl bg-[#14102A] p-4 gap-3`}>
                <View style={tw`flex-row items-start gap-3`}>
                  <View style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#FFD76A]`}>
                    <Text style={tw`text-[11px] font-bold text-[#2A2209]`}>1</Text>
                  </View>
                  <Text style={tw`flex-1 text-sm leading-5 text-white`}>
                    Transfer the exact amount to the account above.
                  </Text>
                </View>
                <View style={tw`flex-row items-start gap-3`}>
                  <View style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#FFD76A]`}>
                    <Text style={tw`text-[11px] font-bold text-[#2A2209]`}>2</Text>
                  </View>
                  <Text style={tw`flex-1 text-sm leading-5 text-white`}>
                    Keep this screen open or check back here. We refresh every 5 seconds until confirmation comes in.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}
        {isStatusSuccess ? (
          <>
            <View style={tw`mt-5 rounded-2xl bg-[#07164F] border border-[#1D3AA4] overflow-hidden`}>
              <View style={tw`px-4 py-2.5 bg-[#0FF1CF]`}>
                <Text style={tw`text-[#01082E] text-xs font-bold tracking-widest uppercase`}>
                  Next Move
                </Text>
              </View>

              <View style={tw`px-4 py-5 gap-4`}>
                <Text style={tw`text-white text-xl font-bold`}>
                  {`You're in, ${user?.username || "Explorer"} 👋`}
                </Text>
                <Text style={tw`text-[#D9E2FF] text-sm leading-6`}>
                  {isPhysicalEventForCta
                    ? `${eventTitleForCta} is active. Catch live moments and lock in your ride plan before things heat up.`
                    : `${eventTitleForCta} is active. Catch live moments, updates, and community buzz as things unfold.`}
                </Text>

                <View style={tw`rounded-xl bg-[#0A1E63] border border-[#2848C8] p-3 flex-row items-start gap-3`}>
                  <Flame size={18} color="#0FF1CF" />
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-white font-semibold`}>Live Feed</Text>
                    <Text style={tw`text-[#C8D3FF] text-xs mt-0.5`}>
                      Real-time event updates, reactions, and buzz from attendees.
                    </Text>
                  </View>
                </View>

                {isPhysicalEventForCta ? (
                  <View style={tw`rounded-xl bg-[#0A1E63] border border-[#2848C8] p-3 flex-row items-start gap-3`}>
                    <CarFront size={18} color="#0FF1CF" />
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-white font-semibold`}>
                        Carpool Tab
                      </Text>
                      <Text style={tw`text-[#C8D3FF] text-xs mt-0.5`}>
                        Find nearby rides or create one and pull your crew together.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={tw`w-full mt-5 mb-8`}>
              <CustomButton
                onPress={goToEventFeed}
                title={
                  isPhysicalEventForCta
                    ? "Join the Buzz, Find Your Ride"
                    : "Join the Buzz"
                }
                buttonClassName="bg-[#0FF1CF] w-full border-0"
                textClassName="!text-black"
                arrowCircleColor="bg-[#0C7F7F]"
                showArrow
              />
            </View>
          </>
        ) : null}
      </ScrollView>

      {hasTickets && (
        <BottomSheet
          index={-1}
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
            />
          )}
          backgroundStyle={{ backgroundColor: "#01082E" }}
        >
          <View style={tw`flex flex-row justify-between items-center p-5`}>
            <Text style={tw`text-white`}>
              {transactionType === "REGISTRATION" ? "Registration Pass" : "Tickets"}
            </Text>
            <Text style={tw`text-white text-xs`}>{tickets.length} available</Text>
          </View>

          <BottomSheetScrollView style={tw`p-5`}>
            {tickets.length > 0 && (
              <View style={tw`rounded-2xl bg-[#010E3A] px-5`}>
                <View style={tw`flex flex-row gap-8 p-5 items-center`}>
                  <Image
                    src={tickets[currentIndex]?.event?.thumbnailUrl}
                    style={tw`w-20 h-20 rounded-md bg-white`}
                  />
                  <View style={tw`py-2 w-2/3`}>
                    <TouchableOpacity
                      style={tw`px-5 py-2 rounded-3xl bg-[#0FF1CF] self-start`}
                    >
                      <Text style={tw`capitalize`}>
                        {transactionType === "REGISTRATION"
                          ? "Registration"
                          : tickets[currentIndex]?.eventTicketType}
                      </Text>
                    </TouchableOpacity>
                    <Text style={tw`text-[#fff] text-lg`}>
                      {tickets[currentIndex]?.event?.title}
                    </Text>
                  </View>
                </View>

                <DashedLine />

                <View style={tw`ml-3 my-8 gap-8`}>
                  <View style={tw`flex flex-row gap-5 items-center`}>
                    <Calendar color={"white"} />
                    <EventDetails
                      title="date & time"
                      subtitle={formatEventDateTime(
                        tickets[currentIndex]?.event?.startDate,
                        tickets[currentIndex]?.event?.endDate
                      )}
                    />
                  </View>
                </View>

                <DashedLine />

                <View
                  style={tw`max-w-[500px] w-full py-8 flex-row justify-center items-center`}
                >
                  <View
                    style={tw`w-48 h-48 rounded-2xl bg-[#FFFDFD] flex-row justify-center items-center`}
                  >
                    <QRCodeGenerator value={tickets[currentIndex]?.qrCode} />
                  </View>
                </View>

                <View style={tw`flex-row justify-between py-4`}>
                  <TouchableOpacity
                    disabled={currentIndex === 0}
                    onPress={handlePrev}
                    style={tw`px-4 py-2 bg-gray-700 rounded-lg`}
                  >
                    <Text style={tw`text-white`}>Prev</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={currentIndex === tickets.length - 1}
                    onPress={handleNext}
                    style={tw`px-4 py-2 bg-[#0FF1CF] rounded-lg`}
                  >
                    <Text style={tw`text-black`}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </BottomSheetScrollView>

          <View style={tw`w-full px-5 py-5`}>
            <CustomButton
              onPress={goToEventFeed}
              title="Jump Into Feed + Carpools"
              buttonClassName="w-full !border-[#0FF1CF]"
              textClassName="!text-[#0FF1CF]"
              showArrow={false}
            />
          </View>
        </BottomSheet>
      )}
    </View>
  );
};

export default TransactionRef;
