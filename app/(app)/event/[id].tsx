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
import {
  buildImpactDescription,
  formatImpactSummary,
  resolveImpactPercentage,
} from "@/constants/impact";
import { getEventLinkMeta, normalizeEventLink } from "@/constants/eventLinks";
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
import { useEventDetails, useWalletOnboarding } from "@/services/queries";
import { QUERY_KEYS } from "@/services/queryKeys";
import {
  CheckoutPricingConfig,
  DonationResponse,
  GetTickets,
  PaymentInstructions,
  PaymentProvider,
} from "@/types/event";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
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
  Linking,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import FeedBottomSheet from "./FeedBottomSheet";

type CheckoutPreview = {
  grossAmountNaira: number;
  buyerPlatformFeeNaira: number;
  buyerProviderFeeNaira: number;
  chargeAmountNaira: number;
};

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  PAYSTACK: "Paystack",
  ALAT_TRANSFER: "ALAT Transfer",
};

const formatCheckoutAmount = (value: number) =>
  `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const calculatePlatformFeeKobo = (
  baseAmountKobo: number,
  config?: CheckoutPricingConfig | null
) => {
  if (!config || baseAmountKobo <= 0) return 0;

  if (config.platformFee.fixedFeeKobo > 0) {
    return config.platformFee.fixedFeeKobo;
  }

  return Math.round(
    (baseAmountKobo * (config.platformFee.percentageBps || 0)) / 10000
  );
};

const estimateProviderFeeKobo = (
  provider: PaymentProvider,
  chargedAmountKobo: number,
  config?: CheckoutPricingConfig | null
) => {
  if (!config || chargedAmountKobo <= 0) return 0;

  const rule = config.providers[provider];
  if (!rule) return 0;

  const percentageFee = Math.round(
    (chargedAmountKobo * (rule.percentageBps || 0)) / 10000
  );
  const fixedFeeKobo =
    rule.fixedFeeWaiverBelowKobo && chargedAmountKobo < rule.fixedFeeWaiverBelowKobo
      ? 0
      : (rule.fixedFeeKobo || 0);
  const uncappedFee = percentageFee + fixedFeeKobo;

  if (!rule.capKobo) return uncappedFee;
  return Math.min(uncappedFee, rule.capKobo);
};

const buildCheckoutPreview = (
  baseAmountNaira: number,
  provider: PaymentProvider,
  config?: CheckoutPricingConfig | null
): CheckoutPreview => {
  const grossAmountKobo = Math.max(Math.round((baseAmountNaira || 0) * 100), 0);

  if (!config || grossAmountKobo <= 0) {
    return {
      grossAmountNaira: grossAmountKobo / 100,
      buyerPlatformFeeNaira: 0,
      buyerProviderFeeNaira: 0,
      chargeAmountNaira: grossAmountKobo / 100,
    };
  }

  const buyerPlatformFeeKobo =
    config.feeBearers.platformFee === "BUYER"
      ? calculatePlatformFeeKobo(grossAmountKobo, config)
      : 0;

  let chargeAmountKobo = grossAmountKobo + buyerPlatformFeeKobo;

  if (config.feeBearers.providerFee === "BUYER") {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const estimatedFeeKobo = estimateProviderFeeKobo(provider, chargeAmountKobo, config);
      const nextChargeAmountKobo =
        grossAmountKobo + buyerPlatformFeeKobo + estimatedFeeKobo;

      if (nextChargeAmountKobo == chargeAmountKobo) {
        break;
      }

      chargeAmountKobo = nextChargeAmountKobo;
    }
  }

  const buyerProviderFeeKobo =
    config.feeBearers.providerFee === "BUYER"
      ? Math.max(chargeAmountKobo - grossAmountKobo - buyerPlatformFeeKobo, 0)
      : 0;

  return {
    grossAmountNaira: grossAmountKobo / 100,
    buyerPlatformFeeNaira: buyerPlatformFeeKobo / 100,
    buyerProviderFeeNaira: buyerProviderFeeKobo / 100,
    chargeAmountNaira: chargeAmountKobo / 100,
  };
};

const EventPage = () => {
  const queryClient = useQueryClient();
  const { id, openFeed, openPayoutSetup } = useLocalSearchParams<{
    id?: string | string[];
    openFeed?: string | string[];
    openPayoutSetup?: string | string[];
  }>(); // eventId
  const { user } = useAuth();

  const eventId = Array.isArray(id) ? id[0] : id;
  const resolvedEventId = eventId || "";
  const shouldOpenFeedFromRoute = (Array.isArray(openFeed) ? openFeed[0] : openFeed) === "1";
  const shouldOpenPayoutSetup =
    (Array.isArray(openPayoutSetup) ? openPayoutSetup[0] : openPayoutSetup) === "1";
  const router = useLockedRouter();

  const [ticketTotal, setTicketTotal] = useState(0);
  const [selectedTickets, setSelectedTickets] = useState<GetTickets[]>([]);
  const [donationAmount, setDonationAmount] = useState<string>("500");
  const [donationMessage, setDonationMessage] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("PAYSTACK");
  const [showTransferInstructions, setShowTransferInstructions] = useState(false);
  const [transferInstructions, setTransferInstructions] =
    useState<PaymentInstructions | null>(null);
  const [transferCountdownSeconds, setTransferCountdownSeconds] = useState(300);
  const [showCreatorSetupModal, setShowCreatorSetupModal] = useState(false);
  const [showRegistrationCheckout, setShowRegistrationCheckout] = useState(false);
  const [registrationBeneficiaryType, setRegistrationBeneficiaryType] = useState<
    "SELF" | "SPONSORED"
  >("SELF");
  const [registrationSponsorshipNote, setRegistrationSponsorshipNote] =
    useState("");

  const { data, isPending, isError } = useEventDetails(resolvedEventId);
  const { data: onboardingData } = useWalletOnboarding({ enabled: !!user?.id });

  const [showPaystackWebView, setShowPaystackWebView] = useState(false);
  const [paystackPaymentUrl, setPaystackPaymentUrl] = useState<string>("");
  const [currentTransactionId, setCurrentTransactionId] = useState<string>("");
  const [transactionType, setTransactionType] = useState<
    "DONATION" | "REGISTRATION" | "TICKET"
  >("TICKET");


  // Get image status with auto-polling
  const { data: imageStatusData } = useEventImagePolling(
    resolvedEventId,
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
  } = useEventFeedConnection(resolvedEventId, true); // autoJoin = true

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
  const snapPointsDonation = useMemo(() => ["100%"], []);
  const onboarding = onboardingData?.data;
  const paymentOptions = data?.data.paymentOptions;
  const isOwner = data?.data.creator.id === user?.id;
  const registrationFeeAmount = Number(data?.data.registrationFee || 0);
  const registrationPreview = useMemo(
    () =>
      buildCheckoutPreview(
        registrationFeeAmount,
        selectedProvider,
        paymentOptions?.pricingConfig
      ),
    [paymentOptions?.pricingConfig, registrationFeeAmount, selectedProvider]
  );
  const ticketPreview = useMemo(
    () => buildCheckoutPreview(ticketTotal, selectedProvider, paymentOptions?.pricingConfig),
    [paymentOptions?.pricingConfig, selectedProvider, ticketTotal]
  );
  const donationPreview = useMemo(
    () =>
      buildCheckoutPreview(
        Number(parseFloat(donationAmount || "0") || 0),
        selectedProvider,
        paymentOptions?.pricingConfig
      ),
    [donationAmount, paymentOptions?.pricingConfig, selectedProvider]
  );

  const openDonationSheet = useCallback(() => {
    setShowFeed(false);
    setTimeout(() => bottomSheetDonationRef.current?.present?.(), 120);
  }, []);

  const handleCopyAccountNumber = useCallback(async () => {
    const accountNumber = transferInstructions?.accountNumber?.trim();

    if (!accountNumber) {
      showGlobalWarning("Account number is not available yet.");
      return;
    }

    await Clipboard.setStringAsync(accountNumber);
    showGlobalSuccess("Account number copied.");
  }, [transferInstructions?.accountNumber]);

  useEffect(() => {
    const availableProviders = paymentOptions?.availableProviders || [];
    if (!availableProviders.length) return;

    setSelectedProvider((current) =>
      availableProviders.includes(current) ? current : availableProviders[0]
    );
  }, [paymentOptions?.availableProviders]);

  useEffect(() => {
    if (
      shouldOpenPayoutSetup &&
      isOwner &&
      paymentOptions?.requiresPayment &&
      onboarding?.showPersistentAlert
    ) {
      setShowCreatorSetupModal(true);
    }
  }, [isOwner, onboarding?.showPersistentAlert, paymentOptions?.requiresPayment, shouldOpenPayoutSetup]);

  useEffect(() => {
    if (!showTransferInstructions) {
      setTransferCountdownSeconds(300);
      return;
    }

    setTransferCountdownSeconds(300);

    const timer = setInterval(() => {
      setTransferCountdownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [showTransferInstructions, currentTransactionId]);

  const handleProviderInitSuccess = useCallback(
    (
      payload: {
        data: {
          transactionId: string;
          paymentUrl: string | null;
          paymentInstructions?: PaymentInstructions | null;
          freeTickets?: any[];
        };
      },
      type: "DONATION" | "REGISTRATION" | "TICKET"
    ) => {
      setCurrentTransactionId(payload.data.transactionId);
      setTransactionType(type);
      setShowRegistrationCheckout(false);

      if (payload.data.paymentUrl) {
        setPaystackPaymentUrl(payload.data.paymentUrl);
        setShowPaystackWebView(true);
        return;
      }

      if (payload.data.paymentInstructions) {
        bottomSheetRef.current?.dismiss?.();
        bottomSheetDonationRef.current?.dismiss?.();
        setTransferInstructions(payload.data.paymentInstructions);
        setShowTransferInstructions(true);
        return;
      }

      router.push(`/transaction/${payload.data.transactionId}?type=${type}`);
    },
    [router]
  );

  const renderProviderSelector = useCallback(
    (
      baseAmountNaira: number,
      accent: "teal" | "red" = "teal",
      title = "Choose payment method"
    ) => {
      if (!paymentOptions?.requiresPayment || baseAmountNaira <= 0) {
        return null;
      }

      const providerPreviews = paymentOptions.availableProviders.map((provider) => ({
        provider,
        preview: buildCheckoutPreview(
          baseAmountNaira,
          provider,
          paymentOptions.pricingConfig
        ),
      }));
      const selectedPreview = buildCheckoutPreview(
        baseAmountNaira,
        selectedProvider,
        paymentOptions.pricingConfig
      );
      const accentBg = accent == "red" ? "bg-[#FF6B6B]" : "bg-[#0FF1CF]";
      const accentText = accent == "red" ? "text-[#FF9D9D]" : "text-[#0FF1CF]";

      return (
        <View style={tw`rounded-2xl bg-[#101C45] p-3`}>
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <Text style={tw`flex-1 text-sm font-semibold text-white`}>{title}</Text>
            <Text style={tw.style("text-sm font-bold", accentText)}>
              {formatCheckoutAmount(selectedPreview.chargeAmountNaira)}
            </Text>
          </View>
          <Text style={tw`mt-1 text-xs leading-5 text-gray-400`}>
            {selectedProvider == "ALAT_TRANSFER"
              ? "Transfer instructions appear after you confirm."
              : "Secure checkout powered by Paystack."}
          </Text>

          <View style={tw`mt-3 flex-row flex-wrap gap-2`}>
            {providerPreviews.map(({ provider, preview }) => {
              const selected = provider == selectedProvider;

              return (
                <TouchableOpacity
                  key={provider}
                  onPress={() => setSelectedProvider(provider)}
                  style={tw.style(
                    "min-w-[130px] flex-1 rounded-2xl border px-3 py-3",
                    selected
                      ? `${accentBg} border-transparent`
                      : "border-[#2A3E6A] bg-[#08143B]"
                  )}
                >
                  <Text
                    style={tw.style(
                      "text-xs font-semibold uppercase tracking-wide",
                      selected ? "text-[#03122F]" : "text-gray-400"
                    )}
                  >
                    {PROVIDER_LABELS[provider]}
                  </Text>
                  <Text
                    style={tw.style(
                      "mt-1 text-sm font-bold",
                      selected ? "text-[#041130]" : "text-white"
                    )}
                  >
                    {formatCheckoutAmount(preview.chargeAmountNaira)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    },
    [paymentOptions, selectedProvider]
  );

  // Effect to update event data when image upload completes
  useEffect(() => {
    if (imageStatusData?.data && !imageStatusData.data.isProcessing) {
      // Image upload completed, update the main event query cache
      queryClient.setQueryData(
        [QUERY_KEYS.eventDetails, resolvedEventId],
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
  }, [imageStatusData, queryClient, resolvedEventId]);

  const { mutateAsync, isPending: gettingTickets } = useGetTickets({
    onSuccess: (response) => {
      showGlobalSuccess("Checkout started successfully.");

      if (response.data.freeTickets.length > 0 && response.data.paymentUrl) {
        showGlobalSuccess("Free tickets created. Continuing with the paid checkout.", 6);
      }

      handleProviderInitSuccess(response, "TICKET");
    },
    onError: (error) => {
      console.log(error);
      showGlobalError("Error initiating transaction");
    },
  });

  const { mutateAsync: registerEvent, isPending: registeringEvent } =
    useRegisterEvent({
      onSuccess: (response) => {
        showGlobalSuccess("Checkout started successfully.");
        handleProviderInitSuccess(response, "REGISTRATION");
      },
      onError: (error) => {
        console.log(error);
        showGlobalError("Error initiating transaction");
      },
    });

  const { mutateAsync: initiateDonation, isPending: initiatingDonation } =
    useInitiateDonation({
      onSuccess: (response: DonationResponse) => {
        showGlobalSuccess("Donation initiated successfully.");
        handleProviderInitSuccess(response, "DONATION");
      },
      onError: (error) => {
        console.error("Donation initiation failed:", error);

        showGlobalError("Failed to initiate donation");
      },
    });

  const handleTransaction = useCallback(async (isRegistration?: boolean) => {
    if (isRegistration) {
      await registerEvent({
        eventId: resolvedEventId,
        provider: selectedProvider,
        platform: "mobile",
        beneficiaryType: registrationBeneficiaryType,
        sponsorshipNote:
          registrationBeneficiaryType === "SPONSORED"
            ? registrationSponsorshipNote.trim() || undefined
            : undefined,
      });
      return;
    }

    await mutateAsync({
      items: selectedTickets,
      provider: selectedProvider,
      clientContext: {
        platform: "mobile",
      },
    });
  }, [
    mutateAsync,
    registerEvent,
    registrationBeneficiaryType,
    registrationSponsorshipNote,
    resolvedEventId,
    selectedProvider,
    selectedTickets,
  ]);

  const handleRegisterPress = useCallback(() => {
    if (registrationFeeAmount > 0 && paymentOptions?.requiresPayment) {
      setRegistrationBeneficiaryType("SELF");
      setRegistrationSponsorshipNote("");
      setShowRegistrationCheckout(true);
      return;
    }

    handleTransaction(true);
  }, [handleTransaction, paymentOptions?.requiresPayment, registrationFeeAmount]);

  const handleDonation = async () => {
    const amount = parseFloat(donationAmount);

    // Validate minimum amount (₦500 minimum)
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
        eventId: resolvedEventId,
        amount,
        message: donationMessage,
        isAnonymous,
        provider: selectedProvider,
        clientContext: {
          platform: "mobile",
        },
      });
    } catch (error) {
      console.error("Donation error:", error);
    }
  }

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
        setTimeout(() => handleRegisterPress(), 120);
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
        if (data?.data?.isPhysicalEvent === false) {
          setShowFeed(false);
          showGlobalError("Carpool is only available for physical events");
          return;
        }
        setShowFeed(false);
        router.push({
          pathname: "/new-carpool",
          params: { eventId: resolvedEventId, autoOpenEventPicker: "1" },
        });
      }
    },
    [
      data?.data?.isPhysicalEvent,
      handleRegisterPress,
      handleShare,
      openDonationSheet,
      openSheet,
      resolvedEventId,
      router,
    ]
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

  const owner = isOwner;
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
          {isNotFound ? resolvedEventId : "Something went wrong"}
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
    impactTitle,
    impactDescription,
    impactPercentage,
    imageUrl,
    startDate,
    endDate,
    isPhysicalEvent,
    links,
    location,
    eventTickets,
    creator,
    registrationFee,
    registrationType,
  } = data?.data;

  const eventDateTime = formatEventDateTime(startDate, endDate);
  const eventEndBoundary = endDate || startDate;
  const parsedEventEndBoundary = eventEndBoundary
    ? new Date(eventEndBoundary)
    : null;
  const hasEventEnded = Boolean(
    parsedEventEndBoundary &&
      !Number.isNaN(parsedEventEndBoundary.getTime()) &&
      parsedEventEndBoundary.getTime() < Date.now()
  );
  const impactSummary = formatImpactSummary({
    impactTitle,
    impactPercentage,
    registrationType,
  });
  const impactNote = buildImpactDescription(impactTitle, impactDescription);
  const resolvedImpactPercentage = resolveImpactPercentage(
    registrationType,
    impactPercentage,
  );
  const eventLinks = links || [];

  const handleOpenEventLink = async (url: string) => {
    const normalizedUrl = normalizeEventLink(url);
    const supported = await Linking.canOpenURL(normalizedUrl);
    if (!supported) {
      showGlobalError("Invalid event link");
      return;
    }

    await Linking.openURL(normalizedUrl);
  };

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
            onClickBack={() => safeGoBack(router, "/")}
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
            registrationType={registrationType}
          />
          <CustomView style={tw`py-2 px-5`}>
            <Text style={tw`text-white text-lg font-bold`}>{title}</Text>
          </CustomView>
          {hasEventEnded && (
            <CustomView style={tw`px-5 pb-4`}>
              <View style={tw`rounded-3xl border border-[#24345A] bg-[#0A173F] p-4`}>
                <Text style={tw`text-sm font-semibold text-[#F1D417]`}>
                  This event has ended
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#C6D5F2]`}>
                  You can still review the event details, impact story, organizer profile, and related links here.
                </Text>
              </View>
            </CustomView>
          )}
          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />
          <CustomView style={tw`py-2 px-5`}>
            <View style={tw`gap-3`}>
              <Text style={tw`uppercase text-white`}>About this event</Text>
              <Text style={tw`text-white`}>{description}</Text>
            </View>
          </CustomView>
          <CustomView style={tw`px-5 pb-4`}>
            <View style={tw`rounded-3xl bg-[#101C45] p-4`}>
              <View style={tw`flex-row items-start justify-between gap-3`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}>
                    Direct impact
                  </Text>
                  <Text style={tw`mt-2 text-lg font-semibold text-white`}>
                    {impactSummary || "Cause-led event"}
                  </Text>
                  <Text style={tw`mt-2 text-sm leading-6 text-[#C6D5F2]`}>
                    {impactNote}
                  </Text>
                </View>
                <View style={tw`rounded-full bg-[#0FF1CF] px-3 py-2`}>
                  <Text style={tw`text-sm font-bold text-[#03122F]`}>
                    {resolvedImpactPercentage}%
                  </Text>
                </View>
              </View>
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
                  <EventDetails
                    title="Location"
                    subtitle={
                      isPhysicalEvent
                        ? location || "Venue to be announced"
                        : "No physical meetup"
                    }
                  />
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
          {eventLinks.length > 0 && (
            <>
              <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />
              <CustomView style={tw`px-5 py-2`}>
                <Text style={tw`uppercase text-white`}>event links</Text>

                <View style={tw`mt-4 gap-3`}>
                  {eventLinks.map((link, index) => {
                    const linkMeta = getEventLinkMeta(link);

                    return (
                      <TouchableOpacity
                        key={`${link}-${index}`}
                        style={tw`rounded-3xl bg-[#101C45] px-4 py-4`}
                        onPress={() => handleOpenEventLink(link)}
                      >
                        <View style={tw`flex-row items-center`}>
                          <View
                            style={[
                              tw`h-12 w-12 items-center justify-center rounded-2xl`,
                              { backgroundColor: linkMeta.backgroundColor },
                            ]}
                          >
                            <Ionicons
                              name={linkMeta.icon}
                              size={20}
                              color={linkMeta.iconColor}
                            />
                          </View>

                          <View style={tw`ml-3 flex-1`}>
                            <Text style={tw`text-base font-semibold text-white`}>
                              {linkMeta.label}
                            </Text>
                            <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                              {linkMeta.host || linkMeta.subtitle}
                            </Text>
                          </View>

                          <View style={tw`rounded-full bg-[#0FF1CF]/12 px-3 py-2`}>
                            <Text style={tw`text-xs font-semibold text-[#0FF1CF]`}>
                              Open
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </CustomView>
            </>
          )}
          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />
          {owner && onboarding?.showPersistentAlert && paymentOptions?.requiresPayment && (
            <CustomView style={tw`px-5 py-4`}>
              <View style={tw`rounded-3xl border border-[#F1D417] bg-[#1B2A50] p-4`}>
                <Text style={tw`text-sm font-bold text-[#F1D417]`}>Payout setup still needs attention</Text>
                <Text style={tw`mt-2 text-sm leading-5 text-white`}>
                  {onboarding.nextAction == "ADD_SETTLEMENT_ACCOUNT"
                    ? "Add your settlement account so we know where to pay your earnings."
                    : onboarding.nextAction == "COMPLETE_KYC"
                    ? "Complete identity verification so your earnings can be released."
                    : "We are still preparing ALAT transfer for this creator account."}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreatorSetupModal(true)}
                  style={tw`mt-4 rounded-full bg-[#0FF1CF] px-4 py-3`}
                >
                  <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                    Continue setup
                  </Text>
                </TouchableOpacity>
              </View>
            </CustomView>
          )}
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
                onPress={() => router.push(`/event/edit/${resolvedEventId}`)}
              >
                <Edit2Icon color="#0FF1CF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {hasEventEnded ? (
          <View style={tw`px-5 w-full max-w-[500px]`}>
            <CustomButton
              disabled
              onPress={() => null}
              buttonClassName="bg-[#1B2A50] border border-[#2B3C66] w-full max-w-[500px]"
              textClassName="!text-[#8FA1CB]"
              arrowCircleColor="bg-[#22315E]"
              title="Event ended"
            />
          </View>
        ) : registrationType === "ticket" ? (
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
              onPress={handleRegisterPress}
              disabled={registeringEvent}
              buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
              textClassName="!text-black"
              arrowCircleColor="bg-[#0C7F7F]"
              title={registeringEvent ? "Registering" : "Register"}
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
        keyboardBehavior="fillParent"
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
          <View style={tw`py-5 gap-5`}>
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

        <View style={tw`w-full max-w-[500px] gap-3 p-5`}>
          {renderProviderSelector(ticketTotal)}
          <CustomButton
            onPress={() => handleTransaction(false)}
            disabled={selectedTickets.length === 0 || gettingTickets}
            title={
              gettingTickets
                ? "Initiating..."
                : ticketTotal > 0
                ? `Pay ${formatCheckoutAmount(ticketPreview.chargeAmountNaira)}`
                : "Claim tickets"
            }
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
          />
        </View>
      </BottomSheetModal>

      <Modal visible={showRegistrationCheckout} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/60 px-5 py-8`}>
          <View style={tw`rounded-[28px] bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <View>
                <Text style={tw`text-xl font-bold text-white`}>Complete registration</Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#9FB0D8]`}>
                  Choose a payment method and continue with your registration.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRegistrationCheckout(false)}
                style={tw`h-10 w-10 items-center justify-center rounded-full bg-[#0A173F]`}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={tw`mt-5`}>
              {renderProviderSelector(
                Number(registrationFee || 0),
                "teal",
                "Select payment method"
              )}
            </View>

            <View style={tw`mt-5`}>
              <View style={tw`mb-4 flex-row gap-3`}>
                <TouchableOpacity
                  onPress={() => setRegistrationBeneficiaryType("SELF")}
                  style={tw.style(
                    "flex-1 rounded-2xl border px-4 py-4",
                    registrationBeneficiaryType === "SELF"
                      ? "border-[#0FF1CF] bg-[#0FF1CF]"
                      : "border-[#223B68] bg-[#08143B]",
                  )}
                >
                  <Text
                    style={tw.style(
                      "text-sm font-semibold",
                      registrationBeneficiaryType === "SELF"
                        ? "text-[#03122F]"
                        : "text-white",
                    )}
                  >
                    Register me
                  </Text>
                  <Text
                    style={tw.style(
                      "mt-2 text-xs leading-5",
                      registrationBeneficiaryType === "SELF"
                        ? "text-[#123B3B]"
                        : "text-[#95A7D3]",
                    )}
                  >
                    Buy this registration for yourself right now.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRegistrationBeneficiaryType("SPONSORED")}
                  style={tw.style(
                    "flex-1 rounded-2xl border px-4 py-4",
                    registrationBeneficiaryType === "SPONSORED"
                      ? "border-[#0FF1CF] bg-[#0FF1CF]"
                      : "border-[#223B68] bg-[#08143B]",
                  )}
                >
                  <Text
                    style={tw.style(
                      "text-sm font-semibold",
                      registrationBeneficiaryType === "SPONSORED"
                        ? "text-[#03122F]"
                        : "text-white",
                    )}
                  >
                    Sponsor a spot
                  </Text>
                  <Text
                    style={tw.style(
                      "mt-2 text-xs leading-5",
                      registrationBeneficiaryType === "SPONSORED"
                        ? "text-[#123B3B]"
                        : "text-[#95A7D3]",
                    )}
                  >
                    Pay for someone else and let the creator assign the beneficiary.
                  </Text>
                </TouchableOpacity>
              </View>

              {registrationBeneficiaryType === "SPONSORED" && (
                <View style={tw`mb-4 rounded-2xl bg-[#08143B] p-4`}>
                  <Text style={tw`text-sm font-semibold text-white`}>
                    Optional note to the organizer
                  </Text>
                  <TextInput
                    value={registrationSponsorshipNote}
                    onChangeText={setRegistrationSponsorshipNote}
                    placeholder="Say who you'd love this spot to reach, or leave it open."
                    placeholderTextColor="#8FA1CB"
                    multiline
                    style={tw`mt-3 min-h-[96px] rounded-2xl bg-[#101C45] p-4 text-white`}
                  />
                </View>
              )}

              <CustomButton
                onPress={() => {
                  setShowRegistrationCheckout(false);
                  handleTransaction(true);
                }}
                disabled={registeringEvent}
                buttonClassName="bg-[#0FF1CF] border-0 w-full"
                textClassName="!text-black"
                arrowCircleColor="bg-[#0C7F7F]"
                title={
                  registeringEvent
                    ? registrationBeneficiaryType === "SPONSORED"
                      ? "Funding spot"
                      : "Registering"
                    : `${
                        registrationBeneficiaryType === "SPONSORED"
                          ? "Sponsor spot"
                          : "Register for"
                      } ${formatCheckoutAmount(
                        registrationPreview.chargeAmountNaira
                      )}`
                }
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* BottomSheet for Donation */}
      <BottomSheetModal
        ref={bottomSheetDonationRef}
        snapPoints={snapPointsDonation}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="fillParent"
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
          contentContainerStyle={{ paddingBottom: 180 }}
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
              <BottomSheetTextInput
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
            <BottomSheetTextInput
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

          {renderProviderSelector(Number(parseFloat(donationAmount || "0") || 0), "red")}

          <CustomView style={tw`mb-7`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="shield-checkmark" size={20} color="#0FF1CF" />
              <Text style={tw`text-white ml-2 text-sm`}>
                {selectedProvider == "ALAT_TRANSFER"
                  ? "Bank transfer checkout via ALAT"
                  : "Secure payment powered by Paystack"}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="information-circle" size={20} color="#0FF1CF" />
              <Text style={tw`text-white ml-2 text-sm`}>
                {selectedProvider == "ALAT_TRANSFER"
                  ? "We’ll show transfer instructions after you confirm the donation."
                  : "All donations are processed securely."}
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
                : `Donate ${formatCheckoutAmount(
                    donationPreview.chargeAmountNaira
                  )}`
            }
          />
        </View>
      </BottomSheetModal>
      <FeedBottomSheet
        eventId={resolvedEventId}
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

      <Modal visible={showTransferInstructions} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/60 px-5 py-8`}>
          <View style={tw`rounded-[28px] bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <View style={tw`rounded-full bg-[#0FF1CF]/15 px-3 py-1.5`}>
                <Text style={tw`text-[11px] font-semibold uppercase tracking-wider text-[#0FF1CF]`}>
                  ALAT transfer
                </Text>
              </View>
              <View style={tw`rounded-full border border-[#2A3E6A] px-3 py-1.5`}>
                <Text style={tw`text-[11px] font-semibold uppercase tracking-wider text-white`}>
                  Awaiting payment
                </Text>
              </View>
            </View>
            <Text style={tw`text-xl font-bold text-white`}>Complete your transfer</Text>
          

            <View style={tw`mt-4 gap-2 rounded-3xl bg-[#09173A] p-4`}>
              <View style={tw`flex-row items-start gap-3`}>
                <View style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#0FF1CF]`}>
                  <Text style={tw`text-[11px] font-bold text-[#03122F]`}>1</Text>
                </View>
                <Text style={tw`flex-1 text-sm leading-5 text-white`}>
                  Transfer exactly {formatCheckoutAmount(transferInstructions?.amountInNaira || 0)} to the account below.
                </Text>
              </View>
              <View style={tw`flex-row items-start gap-3`}>
                <View style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#0FF1CF]`}>
                  <Text style={tw`text-[11px] font-bold text-[#03122F]`}>2</Text>
                </View>
                <Text style={tw`flex-1 text-sm leading-5 text-white`}>
                  Come back here after payment to track confirmation.
                </Text>
              </View>
            </View>

            <View style={tw`mt-5 gap-3 rounded-3xl bg-[#0A173F] p-4`}>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>Amount</Text>
                <Text style={tw`mt-1 text-lg font-bold text-[#0FF1CF]`}>
                  {formatCheckoutAmount(transferInstructions?.amountInNaira || 0)}
                </Text>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>Bank</Text>
                <Text style={tw`mt-1 text-sm font-semibold text-white`}>
                  {transferInstructions?.bankName || "Wema Bank"}
                </Text>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>Account name</Text>
                <Text style={tw`mt-1 text-sm font-semibold text-white`}>
                  {transferInstructions?.accountName || paymentOptions?.alatTransferDisplayName || "GatherGo"}
                </Text>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>Account number</Text>
                <View style={tw.style("flex-row items-center gap-5")}>
                <Text selectable style={tw` text-lg font-bold text-white`}>
                  {transferInstructions?.accountNumber || "-"}
                </Text>
                <TouchableOpacity
                  onPress={() => void handleCopyAccountNumber()}
                  disabled={!transferInstructions?.accountNumber}
                  style={tw.style(
                    " self-start rounded-full border border-[#2A3E6A] px-3 py-2",
                    !transferInstructions?.accountNumber && "opacity-50"
                  )}
                >
                  <Text style={tw`text-xs font-semibold uppercase tracking-wide text-white`}>
                    Copy number
                  </Text>
                </TouchableOpacity>
                </View>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>Expires in</Text>
                <Text style={tw`mt-1 text-lg font-bold text-[#FFD76A]`}>
                  {formatCountdown(transferCountdownSeconds)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowTransferInstructions(false);
                router.push(`/transaction/${currentTransactionId}?type=${transactionType}`);
              }}
              style={tw`mt-5 rounded-full bg-[#0FF1CF] px-4 py-4`}
            >
              <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                I’ve made the transfer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTransferInstructions(false)}
              style={tw`mt-3 rounded-full border border-[#2A3E6A] px-4 py-4`}
            >
              <Text style={tw`text-center text-sm font-semibold text-white`}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCreatorSetupModal} transparent animationType="fade">
        <View style={tw`flex-1 items-center justify-center bg-black/65 px-5`}>
          <View style={tw`w-full max-w-[420px] rounded-[28px] bg-[#041130] p-5`}>
            <Text style={tw`text-xl font-bold text-white`}>Finish payout setup</Text>
            <Text style={tw`mt-3 text-sm leading-6 text-[#B7C5E9]`}>
              {onboarding?.nextAction == "ADD_SETTLEMENT_ACCOUNT"
                ? "Your paid event is live. Add the settlement account next so we know where to pay your earnings."
                : onboarding?.nextAction == "COMPLETE_KYC"
                ? "Your event can keep collecting payments, but payouts will stay on hold until identity verification is complete."
                : "Your monetized event is ready. The next step is finishing the remaining wallet setup so all payout options are available."}
            </Text>

            <View style={tw`mt-5 rounded-2xl bg-[#0A173F] p-4`}>
              <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>Why this matters</Text>
              <Text style={tw`mt-2 text-sm leading-5 text-white`}>
                Buyers can keep paying now. This step is about unlocking settlement and making sure the payout account belongs to the right creator.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowCreatorSetupModal(false);
                router.push("/wallet");
              }}
              style={tw`mt-5 rounded-full bg-[#0FF1CF] px-4 py-4`}
            >
              <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                Complete in Wallet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCreatorSetupModal(false)}
              style={tw`mt-3 rounded-full border border-[#2A3E6A] px-4 py-4`}
            >
              <Text style={tw`text-center text-sm font-semibold text-white`}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
