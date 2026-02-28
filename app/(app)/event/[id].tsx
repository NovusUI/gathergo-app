// EventPage.tsx
import AvatarWithLabel from "@/components/AvatarWithLabel";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { EventImageWithProcessing } from "@/components/EventImageWithProcessing";
import { PaystackWebViewWrapper } from "@/components/PaystackWebViewWrapper";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import PricingCard from "@/components/eventInfo/TicketCard";
import FlameFeedButton from "@/components/feed/FlameFeedButton";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EventDetails } from "@/components/ui/EventDetails";
import { spacing } from "@/constants/spacing";
import { useAuth } from "@/context/AuthContext";
import { useEventFeedConnection } from "@/hooks/useEventFeedConnection";
import { useEventImagePolling } from "@/hooks/useEventImagePolling";
import {
  useFollowUser,
  useGetTickets,
  useInitiateDonation,
  useRegisterEvent,
} from "@/services/mutations";
import { useEventDetails } from "@/services/queries";
import { QUERY_KEYS } from "@/services/queryKeys";
import { DonationResponse, GetTickets } from "@/types/event";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Edit2Icon,
  HandHeart,
  MapIcon,
  PenLineIcon,
  Share2Icon,
  Ticket,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePaystack } from "react-native-paystack-webview";
import tw from "twrnc";
import FeedBottomSheet from "./FeedBottomSheet";

const EventPage = () => {
  const queryClient = useQueryClient();
  const { id, openFeed } = useLocalSearchParams<{
    id?: string | string[];
    openFeed?: string | string[];
  }>(); // eventId
  const { user } = useAuth();

  const eventId = Array.isArray(id) ? id[0] : id;
  const shouldOpenFeedFromRoute = (Array.isArray(openFeed) ? openFeed[0] : openFeed) === "1";
  const router = useRouter();

  const [ticketTotal, setTicketTotal] = useState(0);
  const [selectedTickets, setSelectedTickets] = useState<GetTickets[]>([]);
  const [donationAmount, setDonationAmount] = useState<string>("500"); // Default ₦500
  const [donationMessage, setDonationMessage] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const { data, isPending, isError } = useEventDetails(eventId);

  const [showPaystackWebView, setShowPaystackWebView] = useState(false);
  const [paystackPaymentUrl, setPaystackPaymentUrl] = useState<string>("");
  const [currentTransactionId, setCurrentTransactionId] = useState<string>("");
  const [transactionType, setTransactionType] = useState<
    "DONATION" | "REGISTRATION" | "TICKET"
  >("TICKET");

  // Get image status with auto-polling
  const { data: imageStatusData } = useEventImagePolling(
    eventId,
    Boolean(data?.data.isImageProcessing)
  );

  const {
    pinnedFeeds,
    regularFeeds,
    allFeeds,
    loadMore,
    hasMore,
    loading,
    loadingMore,
    error,
    hideFeed,
    refresh,
    markAllAsSeen,
    setFeedVisibility,
    getFeedStats, // Get stats for animation
  } = useEventFeedConnection(eventId, true); // autoJoin = true

  const feedStats = getFeedStats();
  const [showFeed, setShowFeed] = useState(false);
  const autoOpenFeedDoneRef = useRef(false);

  useEffect(() => {
    setFeedVisibility(showFeed);
    if (showFeed) {
      markAllAsSeen();
    }
  }, [showFeed, setFeedVisibility, markAllAsSeen]);

  useEffect(() => {
    if (!shouldOpenFeedFromRoute || isPending || autoOpenFeedDoneRef.current) {
      return;
    }

    autoOpenFeedDoneRef.current = true;
    const timer = setTimeout(() => {
      setShowFeed(true);
    }, 180);

    return () => clearTimeout(timer);
  }, [isPending, shouldOpenFeedFromRoute]);

  const handleTicketSelection = (
    ticketId: string,
    ticketName: string,
    price: number,
    change: number
  ) => {
    setTicketTotal((prev) => prev + price * change);

    setSelectedTickets((prevTickets) => {
      const existingTicket = prevTickets.find(
        (ticket) => ticket.id === ticketId
      );

      if (existingTicket) {
        const updatedTickets = prevTickets
          .map((ticket) =>
            ticket.id === ticketId
              ? { ...ticket, quantity: ticket.quantity + change }
              : ticket
          )
          .filter((ticket) => ticket.quantity > 0); // Remove if quantity is 0
        return updatedTickets;
      }

      if (change > 0) {
        return [...prevTickets, { id: ticketId, ticketName, quantity: change }];
      }

      return prevTickets;
    });
  };

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["100%"], []);
  const openSheet = useCallback(() => {
    setShowFeed(false);
    setTimeout(() => bottomSheetRef.current?.present?.(), 120);
  }, []);

  const bottomSheetDonationRef = useRef<BottomSheetModal>(null);
  const snapPointsDonation = useMemo(() => ["70%", "85%"], []);

  const openDonationSheet = useCallback(() => {
    setShowFeed(false);
    setTimeout(() => bottomSheetDonationRef.current?.present?.(), 120);
  }, []);

  const closeDonationSheet = useCallback(() => {
    bottomSheetDonationRef.current?.dismiss?.();
  }, []);

  // Effect to update event data when image upload completes
  useEffect(() => {
    if (imageStatusData?.data && !imageStatusData.data.isProcessing) {
      // Image upload completed, update the main event query cache
      queryClient.setQueryData(
        [QUERY_KEYS.eventDetails, eventId],
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              imageUrl: imageStatusData.data.imageUrl,
              thumbnailUrl: imageStatusData.data.thumbnailUrl,
              isImageProcessing: false,
            },
          };
        }
      );

      // Show success message if we now have an image
      if (imageStatusData.data.hasImage) {
        showGlobalSuccess("Image upload complete!");
      }
    }
  }, [imageStatusData, eventId, queryClient]);

  const { popup } = usePaystack();

  const { mutateAsync, isPending: gettingTickets } = useGetTickets({
    onSuccess: (data) => {
      showGlobalSuccess("initiation successful");
      setCurrentTransactionId(data.data.transactionId);

      if (data.data.paymentUrl) {
        setPaystackPaymentUrl(data.data.paymentUrl);
        setTransactionType("TICKET");
        setShowPaystackWebView(true);

        if (data.data.freeTickets.length > 0)
          showGlobalSuccess("Free tickets created.. initializing paystack", 10);

        // if (user?.email) {
        //   popup.newTransaction({
        //     email: user?.email,
        //     amount: data.data.totalAmount,
        //     reference: data.data.transactionId,
        //     onSuccess: () => {
        //       showGlobalSuccess("Transaction successful");
        //       router.push(`/transaction/${data.data.transactionId}`);
        //     },
        //     onCancel: () => {
        //       showGlobalWarning("cancelled");
        //     },
        //     onError: (e) => {
        //       showGlobalError("error");
        //       console.error(e);
        //     },
        //   });
        // }
      } else {
        router.push(`/transaction/${data.data.transactionId}`);
      }
    },
    onError: (error) => {
      console.log(error);
      showGlobalError("Error initiating transaction");
    },
  });

  const { mutateAsync: registerEvent, isPending: registeringEvent } =
    useRegisterEvent({
      onSuccess: (data) => {
        showGlobalSuccess("initiation successful");

        setCurrentTransactionId(data.data.transactionId);

        if (data.data.paymentUrl) {
          setPaystackPaymentUrl(data.data.paymentUrl);
          setTransactionType("REGISTRATION");
          setShowPaystackWebView(true);

          // if (user?.email) {
          //   popup.newTransaction({
          //     email: user?.email,
          //     amount: data.data.totalAmount,
          //     reference: data.data.transactionId,
          //     onSuccess: () => {
          //       showGlobalSuccess("Transaction successful");
          //       router.push(`/transaction/${data.data.transactionId}`);
          //     },
          //     onCancel: () => {
          //       showGlobalWarning("cancelled");
          //     },
          //     onError: (e) => {
          //       showGlobalError("error");
          //       console.log(e);
          //     },
          //   });
          // }
        } else {
          router.push(`/transaction/${data.data.transactionId}`);
        }
      },
      onError: (error) => {
        console.log(error);
        showGlobalError("Error initiating transaction");
      },
    });

  const { mutateAsync: initiateDonation, isPending: initiatingDonation } =
    useInitiateDonation({
      onSuccess: (data: DonationResponse) => {
        showGlobalSuccess("Donation initiated successfully");

        setCurrentTransactionId(data.data.transactionId);

        if (data.data.paymentUrl) {
          setPaystackPaymentUrl(data.data.paymentUrl);
          setTransactionType("DONATION");
          setShowPaystackWebView(true);

          // if (user?.email) {
          //   console.log("called", Date.now);
          //   popup.newTransaction({
          //     email: user.email,
          //     amount: data.data.totalAmount,
          //     reference: data.data.transactionId,

          //     onSuccess: () => {
          //       showGlobalSuccess("Donation successful!");

          //       router.push(
          //         `/transaction/${data.data.transactionId}?type=DONATION`
          //       );
          //     },
          //     onCancel: () => {
          //       showGlobalWarning("Donation cancelled");
          //     },
          //     onError: (e) => {
          //       showGlobalError("Payment error");

          //       console.error(e);
          //     },
          //   });
          // } else {
          //   showGlobalError("User email not found");
          // }
        } else {
          console.log("🆓 Free donation, redirecting...");
          router.push(`/transaction/${data.data.transactionId}?type=DONATION`);
        }
      },
      onError: (error) => {
        console.error("Donation initiation failed:", error);

        showGlobalError("Failed to initiate donation");
      },
    });

  const handleTransaction = async (isRegistration?: boolean) => {
    if (isRegistration) {
      await registerEvent(eventId);
      return;
    }
    if (selectedTickets.length > 0) console.log(selectedTickets);
    await mutateAsync(selectedTickets);
  };

  const handleDonation = useCallback(async () => {
    const amount = parseFloat(donationAmount); // Convert Naira to kobo

    // Validate minimum amount (₦500 = 50000 kobo)
    if (amount < 500) {
      showGlobalError("Minimum donation is ₦500");
      return;
    }

    if (initiatingDonation) {
      showGlobalWarning("Donation already in progress");
      return;
    }
    // Validate that amount is a number
    if (isNaN(amount) || amount <= 0) {
      showGlobalError("Please enter a valid donation amount");
      return;
    }

    console.log("Calling initiateDonation", Date.now());

    try {
      await initiateDonation({
        eventId,
        amount,
        message: donationMessage,
        isAnonymous,
      });
    } catch (error) {
      console.error("Donation error:", error);
    }
  }, [initiatingDonation]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🚗 Join my carpool 👉 https://yourapp.com/carpool/`,
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleFeedAction = useCallback(
    (action: { type?: string; label?: string; carpoolId?: string }) => {
      const actionType = action?.type?.toUpperCase();
      const actionLabel = action?.label?.toUpperCase();
      const normalized = actionType || actionLabel;
      if (!normalized) return;

      if (normalized.includes("TICKET")) {
        openSheet();
        return;
      }

      if (normalized.includes("DONAT")) {
        openDonationSheet();
        return;
      }

      if (normalized.includes("REGISTER")) {
        setShowFeed(false);
        setTimeout(() => handleTransaction(true), 120);
        return;
      }

      if (normalized.includes("SHARE")) {
        setShowFeed(false);
        setTimeout(() => handleShare(), 120);
        return;
      }

      if (normalized.includes("OPEN_CARPOOL") && action.carpoolId) {
        setShowFeed(false);
        router.push(`/carpool/${action.carpoolId}`);
        return;
      }

      if (normalized.includes("CREATE_CARPOOL")) {
        setShowFeed(false);
        router.push({
          pathname: "/new-carpool",
          params: { eventId, autoOpenEventPicker: "1" },
        });
      }
    },
    [eventId, openSheet, openDonationSheet, handleShare, handleTransaction, router]
  );

  const { mutateAsync: followPooler, isPending: isFollowing } = useFollowUser({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.eventDetails, data?.data.id],
      });
      showGlobalSuccess("User followed");
    },
    onError: () => {},
  });

  const owner = data?.data.creator.id === user?.id;
  const followStatus = data?.data.isFollowingCreator
    ? "Following"
    : data?.data.isFollowedByCreator
    ? "Follow back"
    : "Follow";

  const onFollow = () => {
    if (["Follow back", "Follow"].includes(followStatus)) {
      followPooler({
        followingId: creator.id,
      });
    } else {
    }
  };

  // Skeleton UI for loading
  if (isPending) {
    return (
      <View
        style={[
          tw`flex-1 bg-[#01082E]`,
          { paddingTop: spacing.xxl },
        ]}
      >
        <CustomView className={`px-3`}>
          <CustomeTopBarNav
            title="Event Details"
            onClickBack={() => router.replace("/")}
          />
        </CustomView>
        <ScrollView>
          <View
            style={tw`bg-gray-700 h-60 w-full flex items-center justify-center`}
          >
            <View style={tw`w-12 h-12 rounded-full bg-gray-600 mb-2`} />
            <View style={tw`bg-gray-600 h-4 w-32 rounded`} />
            <View style={tw`bg-gray-600 h-3 w-24 rounded mt-1`} />
          </View>
          <View style={tw`bg-gray-700 h-60 w-full`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-6 w-3/4 mb-4 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-full mb-2 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-5/6 rounded`} />
          </View>
          <View style={tw`bg-[#1B2A50]/40 h-2 my-3`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-5 w-1/2 mb-4 rounded`} />
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={tw`flex-row items-center mb-4`}>
                <View style={tw`bg-gray-700 h-8 w-8 rounded-full`} />
                <View style={tw`ml-3`}>
                  <View style={tw`bg-gray-700 h-4 w-32 mb-2 rounded`} />
                  <View style={tw`bg-gray-700 h-3 w-24 rounded`} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={tw`py-5 px-5`}>
          <View style={tw`bg-gray-700 h-12 w-full rounded`} />
        </View>
      </View>
    );
  }

  // Error / Not Found Fallback
  if (isError || !data) {
    const isNotFound = data?.status_code === 404;
    return (
      <View style={tw`flex-1 bg-[#01082E] items-center justify-center px-5`}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF5555" />
        <Text style={tw`text-white text-xl mt-4`}>
          {isNotFound ? eventId : "Something went wrong"}
        </Text>
        <CustomButton
          title="Go Back"
          onPress={() => router.replace("/")}
          buttonClassName="bg-[#0FF1CF] mt-6 w-full max-w-[300px]"
          textClassName="!text-black"
        />
      </View>
    );
  }

  // Extract Event Data
  const {
    title,
    description,
    imageUrl,
    startDate,
    endDate,
    location,
    eventTickets,
    creator,
    registrationFee,
    registrationType,
  } = data?.data;

  const eventDateTime = formatEventDateTime(startDate, endDate);

  return (
    <View
      style={[
        tw`flex-1 pb-5 bg-[#01082E] items-center w-full`,
        { paddingTop: spacing.xxl },
      ]}
    >
      <CustomView style={tw`flex-1`}>
        <CustomView style={tw`px-3`}>
          <CustomeTopBarNav
            title="Event Details"
            onClickBack={() => router.replace("/")}
          />
        </CustomView>

        {/* Animated Fire Button */}
        <View
          style={[
            tw`absolute right-5 top-10`,
            showFeed ? tw`z-0 opacity-0` : tw`z-20`,
          ]}
        >
          <FlameFeedButton
            unreadCount={feedStats.totalCount}
            onPress={() => setShowFeed(true)}
            disabled={showFeed}
          />
        </View>

        <ScrollView
          style={tw`w-full`}
          contentContainerStyle={tw`max-w-[500px]`}
        >
          {/* {imageUrl ? (
            <Image
              source={imageUrl}
              style={{ width: "100%", height: 240 }}
              cachePolicy="disk"
              transition={400}
              contentFit="cover"
            />
          ) : (
            <View
              style={tw`flex-1 items-center justify-center bg-gray-300 h-60`}
            >
              <Ionicons name="image-outline" size={40} color="gray" />
              <Text style={tw`text-gray-500 mt-2`}>No cover picture</Text>
            </View>
          )} */}
          <EventImageWithProcessing
            imageUrl={imageUrl}
            isProcessing={data.data.isImageProcessing}
            height={240}
          />
          <CustomView style={tw`py-2 px-5`}>
            <Text style={tw`text-white text-lg font-bold`}>{title}</Text>
          </CustomView>
          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />
          <CustomView style={tw`py-2 px-5`}>
            <View style={tw`gap-3`}>
              <Text style={tw`uppercase text-white`}>About this event</Text>
              <Text style={tw`text-white`}>{description}</Text>
            </View>
          </CustomView>
          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />
          <CustomView style={tw`py-2 px-5`}>
            <Text style={tw`uppercase text-white`}>event details</Text>

            <View style={tw`ml-3 mt-5`}>
              <View style={tw`flex-row items-center mb-4`}>
                <Calendar color="white" />
                <View style={tw`ml-3 flex-1`}>
                  <EventDetails title="date & time" subtitle={eventDateTime} />
                </View>
              </View>

              <View style={tw`flex-row items-center mb-4`}>
                <MapIcon color="white" />
                <View style={tw`ml-3 flex-1`}>
                  <EventDetails title="Location" subtitle={location} />
                </View>
              </View>

              <View style={tw`flex-row items-center mb-4`}>
                {data.data.donationTarget ? (
                  <HandHeart color={"white"} />
                ) : data.data.registrationType == "registration" ? (
                  <PenLineIcon color={"white"} />
                ) : (
                  <Ticket color="white" />
                )}
                <View style={tw`ml-3 flex-1`}>
                  {registrationType === "ticket" &&
                  eventTickets &&
                  eventTickets.length > 0 ? (
                    <EventDetails
                      title="Tickets"
                      subtitle={
                        eventTickets?.length
                          ? (() => {
                              const prices = eventTickets
                                .map((t) => t.price)
                                .filter(
                                  (p): p is number => p != null && !isNaN(p)
                                );

                              if (prices.length === 0) {
                                return "No valid ticket prices";
                              }

                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);

                              if (minPrice === 0 && maxPrice === 0) {
                                return "Free";
                              }

                              return `${eventTickets.length} Type${
                                eventTickets.length > 1 ? "s" : ""
                              } , ${
                                eventTickets.length > 1
                                  ? `${numberWithCommas(
                                      minPrice,
                                      true,
                                      null
                                    )} - ${numberWithCommas(
                                      maxPrice,
                                      true,
                                      null
                                    )}`
                                  : numberWithCommas(maxPrice, true, null)
                              }`;
                            })()
                          : "No tickets available"
                      }
                    />
                  ) : registrationType === "registration" ? (
                    <EventDetails
                      title="Registration"
                      subtitle={
                        registrationFee && registrationFee > 0
                          ? `${numberWithCommas(registrationFee, true, null)}`
                          : "Free RSVP event"
                      }
                    />
                  ) : registrationType === "donation" ? (
                    <EventDetails
                      title="Donation"
                      subtitle={`Target - ${numberWithCommas(
                        data.data.donationTarget,
                        true,
                        null
                      )}`}
                    />
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={tw`flex-row items-center mb-4`}
                onPress={handleShare}
              >
                <Share2Icon color="white" />
                <View style={tw`ml-3 flex-1`}>
                  <EventDetails title="Share" subtitle="Send to friend." />
                </View>
              </TouchableOpacity>
            </View>
          </CustomView>
          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />
        </ScrollView>

        <View style={tw`py-5`}>
          <View
            style={tw`px-5 w-full max-w-[500px] flex-row justify-between items-center`}
          >
            <AvatarWithLabel
              imageUrl={creator.profilePicUrlTN}
              username={creator.username}
              role="Organizer"
            />
            {!owner && (
              <TouchableOpacity
                style={tw`p-3 rounded-lg bg-[#0c1447]`}
                onPress={onFollow}
              >
                <Text style={tw`text-white`}>
                  {isFollowing ? "Following..." : followStatus}
                </Text>
              </TouchableOpacity>
            )}
            {owner && (
              <TouchableOpacity
                style={tw`p-3 rounded-lg`}
                onPress={() => router.push(`/event/edit/${eventId}`)}
              >
                <Edit2Icon color="#0FF1CF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {registrationType === "ticket" ? (
          <View style={tw`px-5 w-full max-w-[500px]`}>
            <CustomButton
              onPress={openSheet}
              buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
              textClassName="!text-black"
              arrowCircleColor="bg-[#0C7F7F]"
              title="View tickets"
            />
          </View>
        ) : registrationType === "registration" ? (
          <View style={tw`px-5 w-full max-w-[500px]`}>
            <CustomButton
              onPress={() => handleTransaction(true)}
              disabled={registeringEvent}
              buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
              textClassName="!text-black"
              arrowCircleColor="bg-[#0C7F7F]"
              title={
                registeringEvent
                  ? "Registering"
                  : registrationFee && registrationFee > 0
                  ? `Register - ${numberWithCommas(
                      registrationFee,
                      true,
                      null
                    )}`
                  : "Register Now"
              }
            />
          </View>
        ) : registrationType === "donation" ? (
          <View style={tw`px-5 w-full max-w-[500px]`}>
            <CustomButton
              onPress={openDonationSheet}
              buttonClassName="bg-[#FF6B6B] border-0 w-full max-w-[500px]"
              textClassName="!text-white"
              arrowCircleColor="bg-[#D93E3E]"
              title={`Donate Now`}
            />
          </View>
        ) : null}
      </CustomView>

      {/* BottomSheet for Tickets */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <View style={tw`flex-row justify-between items-center p-5`}>
          <Text style={tw`text-white`}>BUY TICKET</Text>
          <AnimatedNumber value={ticketTotal} />
        </View>

        <BottomSheetScrollView
          style={tw`p-5`}
          keyboardShouldPersistTaps="handled"
        >
          <View style={tw`py-5`}>
            {eventTickets?.map((ticket, index) => (
              <PricingCard
                key={index}
                onQuantityChange={(change) =>
                  handleTicketSelection(
                    ticket.id,
                    ticket.type,
                    ticket.updatedPrice || ticket.price || 0,
                    change
                  )
                }
                title={ticket.type}
                price={ticket.price}
                description={ticket.description}
                perks={ticket.perks}
                ticketQuantity={ticket.quantity}
                sold={ticket.sold}
                isVisible={ticket.isVisible}
                updatedPrice={ticket.updatedPrice}
              />
            ))}
          </View>
        </BottomSheetScrollView>

        <View style={tw`w-full max-w-[500px] p-5`}>
          <CustomButton
            onPress={() => handleTransaction(false)}
            disabled={selectedTickets.length === 0 || gettingTickets}
            title={`${gettingTickets ? "initiating..." : "buy tickets"}`}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
          />
        </View>
      </BottomSheetModal>

      {/* BottomSheet for Donation */}
      <BottomSheetModal
        ref={bottomSheetDonationRef}
        snapPoints={snapPointsDonation}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <BottomSheetScrollView
          style={tw`p-5`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={tw`flex-row justify-between items-center mb-5`}>
            <Text style={tw`text-white text-xl font-bold`}>
              Make a Donation
            </Text>
            {/* <TouchableOpacity onPress={closeDonationSheet} style={tw`p-2`}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity> */}
          </View>

          {/* {data.data.donationTarget && (
      <View style={tw`mb-6 bg-[#1B2A50] rounded-xl p-4`}>
        <Text style={tw`text-white text-center mb-2`}>Fundraising Goal</Text>
        <Text style={tw`text-[#0FF1CF] text-2xl font-bold text-center mb-2`}>
          ₦{numberWithCommas(donationTarget / 100, false, null)}
        </Text>
        <View style={tw`h-2 bg-gray-700 rounded-full overflow-hidden`}>
          <View 
            style={[
              tw`h-full bg-[#0FF1CF] rounded-full`,
              { width: `${Math.min((data.data.totalDonations || 0) / donationTarget * 100, 100)}%` }
            ]}
          />
        </View>
        <Text style={tw`text-gray-400 text-sm text-center mt-2`}>
          ₦{numberWithCommas((data.data.totalDonations || 0) / 100, false, null)} raised
        </Text>
      </View>
    )} */}

          <CustomView style={tw`mb-6`}>
            <Text style={tw`text-white mb-3 font-medium`}>
              Donation Amount (₦)
            </Text>

            {/* Quick Amount Buttons */}
            <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
              {[500, 1000, 2500, 5000, 10000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => setDonationAmount(amount.toString())}
                  style={tw`px-4 py-3 rounded-lg ${
                    donationAmount === amount.toString()
                      ? "bg-[#0FF1CF]"
                      : "bg-[#101C45]"
                  }`}
                >
                  <Text
                    style={tw`${
                      donationAmount === amount.toString()
                        ? "text-black font-bold"
                        : "text-white"
                    }`}
                  >
                    ₦{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount Input */}
            <View
              style={tw`flex-row items-center bg-[#101C45] rounded-xl px-4 py-3`}
            >
              <Text style={tw`text-white text-lg mr-2`}>₦</Text>
              <TextInput
                style={tw`flex-1 text-white text-lg`}
                value={donationAmount}
                onChangeText={setDonationAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                onPress={() => setDonationAmount("500")}
                style={tw`bg-[#0FF1CF] px-3 py-1 rounded-lg`}
              >
                <Text style={tw`text-black text-sm`}>Min</Text>
              </TouchableOpacity>
            </View>

            {parseFloat(donationAmount || "0") < 500 && (
              <Text style={tw`text-red-500 text-sm mt-2`}>
                Minimum donation is ₦500
              </Text>
            )}

            <Text style={tw`text-gray-400 text-sm mt-2`}>
              Your donation will help support this event
            </Text>
          </CustomView>

          <CustomView style={tw`mb-6`}>
            <Text style={tw`text-white mb-3 font-medium`}>
              Optional Message (Optional)
            </Text>
            <TextInput
              style={tw`bg-[#101C45] rounded-xl px-4 py-3 text-white min-h-[100px]`}
              value={donationMessage}
              onChangeText={setDonationMessage}
              placeholder="Add a message of support..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={tw`text-gray-400 text-sm mt-2`}>
              This message will be visible to the organizer
            </Text>
          </CustomView>

          <CustomView style={tw`mb-6`}>
            <TouchableOpacity
              style={tw`flex-row items-center justify-between p-3 bg-[#101C45] rounded-xl`}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={tw`flex-row items-center`}>
                <View
                  style={tw`w-6 h-6 rounded-md border-2 ${
                    isAnonymous
                      ? "bg-[#0FF1CF] border-[#0FF1CF]"
                      : "border-gray-500"
                  } mr-3 items-center justify-center`}
                >
                  {isAnonymous && (
                    <Ionicons name="checkmark" size={16} color="black" />
                  )}
                </View>
                <View>
                  <Text style={tw`text-white font-medium`}>
                    Donate anonymously
                  </Text>
                  <Text style={tw`text-gray-400 text-sm`}>
                    Your name won&apos;t be shown publicly
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isAnonymous ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={isAnonymous ? "#0FF1CF" : "gray"}
              />
            </TouchableOpacity>
          </CustomView>

          <CustomView style={tw`mb-7`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="shield-checkmark" size={20} color="#0FF1CF" />
              <Text style={tw`text-white ml-2 text-sm`}>
                Secure payment powered by Paystack
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="information-circle" size={20} color="#0FF1CF" />
              <Text style={tw`text-white ml-2 text-sm`}>
                All donations are processed securely
              </Text>
            </View>
          </CustomView>
        </BottomSheetScrollView>

        <View style={tw`w-full max-w-[500px] p-5`}>
          <CustomButton
            onPress={() => {
              handleDonation();
            }}
            disabled={
              initiatingDonation || parseFloat(donationAmount || "0") < 500
            }
            buttonClassName="bg-[#FF6B6B] w-full border-0"
            textClassName="!text-white"
            showArrow={false}
            title={
              initiatingDonation
                ? "Processing..."
                : `Donate ₦${parseFloat(
                    donationAmount || "0"
                  ).toLocaleString()}`
            }
          />
        </View>
      </BottomSheetModal>
      <FeedBottomSheet
        eventId={eventId}
        isVisible={showFeed}
        onClose={() => setShowFeed(false)}
        onAction={handleFeedAction}
        feedData={{
          pinnedFeeds,
          regularFeeds,
          allFeeds,
          hasMore,
          loading,
          loadingMore,
          error,
          hideFeed,
          loadMore: loadMore, // This is the loadMore function
          refresh,
        }}
      />
      <PaystackWebViewWrapper
        visible={showPaystackWebView}
        onClose={() => setShowPaystackWebView(false)}
        paymentUrl={paystackPaymentUrl}
        type={transactionType}
        onSuccess={(reference) => {
          console.log("✅ Payment successful, reference:", reference);
          showGlobalSuccess("Payment successful!");
          router.push(
            `/transaction/${currentTransactionId}?type=${transactionType}`
          );
        }}
        onCancel={() => {
          console.log("❌ Payment cancelled");
          showGlobalWarning("Payment cancelled");
        }}
        onError={(error) => {
          console.error("💥 Payment error:", error);
          showGlobalError("Payment error occurred");
        }}
      />
    </View>
  );
};

export default EventPage;
