import { getFeedFrenzyLevel } from "@/utils/feedFrenzy";
import { useFreeEventRegistration } from "@/hooks/useFreeEventRegistration";
import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import { useCheckoutCountdown } from "@/hooks/useCheckoutCountdown";
import { checkoutIntentKey } from "@/utils/checkout";
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
import AppToast from "@/components/ui/AppToast";
import { MascotMoment } from "@/components/ui/MascotMoment";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { SdgGoalIcon } from "@/components/ui/SdgGoalIcon";
import { getEventLinkMeta, normalizeEventLink } from "@/constants/eventLinks";
import { normalizePersistedImpactMap } from "@/constants/impact";
import { spacing } from "@/constants/spacing";
import { useAuth } from "@/context/AuthContext";
import { useEventFeedConnection } from "@/hooks/useEventFeedConnection";
import { useEventImagePolling } from "@/hooks/useEventImagePolling";
import {
  useFollowUser,
  useGetTickets,
  useInitiateDonation,
  useRegisterEvent,
  useUpsertEventImpactReport
} from "@/services/mutations";
import { useEventDetails, useWalletOnboarding } from "@/services/queries";
import { QUERY_KEYS } from "@/services/queryKeys";
import {
  CheckoutPricingConfig,
  DonationResponse,
  EventImpactReportOutcome,
  EventTicket,
  GetTickets,
  GetTicketsResponse,
  PaymentInstructions,
  PaymentProvider,
  UpsertEventImpactReportPayload
} from "@/types/event";
import {
  formatEventDateTime,
  isEventEditableBeforeStartDay,
  isEventPastEnd
} from "@/utils/dateTimeHandler";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning
} from "@/utils/globalErrorHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { buildEventShareLink } from "@/utils/shareLinks";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput
} from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { Edit2Icon, Share2Icon } from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps
} from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import tw from "twrnc";
import DontationProgress from "./DontationProgress";
import FeedBottomSheet from "./FeedBottomSheet";
import EventVolunteering from "@/components/volunteer/EventVolunteering";
import VolunteerRolesSheet from "@/components/volunteer/VolunteerRolesSheet";
import VolunteerButton from "@/components/volunteer/VolunteerButton";

type CheckoutPreview = {
  grossAmountNaira: number;
  buyerPlatformFeeNaira: number;
  buyerProviderFeeNaira: number;
  chargeAmountNaira: number;
};

type ImpactReportOutcomeDraft = {
  id?: string;
  type?: string;
  label: string;
  value: string;
  unit: string;
  note?: string;
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type EventTone = {
  label: string;
  accent: string;
  iconName: IoniconName;
};

const createEmptyImpactOutcome = (): ImpactReportOutcomeDraft => ({
  label: "",
  value: "",
  unit: "",
  note: ""
});

const EVENT_TONES: Record<string, EventTone> = {
  volunteer: { label: "Volunteering", accent: "#0FF1CF", iconName: "people-outline" },
  ticket: {
    label: "Ticketed",
    accent: "#0FF1CF",
    iconName: "ticket-outline"
  },
  registration: {
    label: "Registration",
    accent: "#F8D05C",
    iconName: "create-outline"
  },
  donation: {
    label: "Donation",
    accent: "#FF6B6B",
    iconName: "heart-outline"
  }
};

const DEFAULT_EVENT_TONE: EventTone = {
  label: "GatherGo",
  accent: "#31C6F6",
  iconName: "radio-outline"
};

const getEventTone = (registrationType?: string | null) =>
  registrationType
    ? EVENT_TONES[registrationType] || DEFAULT_EVENT_TONE
    : DEFAULT_EVENT_TONE;

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  PAYSTACK: "Paystack",
  ALAT_TRANSFER: "ALAT Transfer"
};

const formatCheckoutAmount = (value: number) =>
  `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const buildOutcomeType = (label: string) => {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "custom_outcome";
};

const parseEvidenceLinks = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((link) => link.trim())
    .filter(Boolean)
    .slice(0, 5);

const formatImpactReportDate = (value?: string | null) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const formatTicketSummary = (eventTickets?: EventTicket[] | null) => {
  if (!eventTickets?.length) return "Tickets soon";

  const visibleTickets = eventTickets.filter(
    (ticket) => ticket.isVisible !== false
  );
  const tickets = visibleTickets.length ? visibleTickets : eventTickets;
  const prices = tickets
    .map((ticket) => Number(ticket.updatedPrice ?? ticket.price))
    .filter((price) => Number.isFinite(price));

  if (!prices.length) {
    return `${tickets.length} ticket type${tickets.length === 1 ? "" : "s"}`;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const ticketCountLabel = `${tickets.length} type${
    tickets.length === 1 ? "" : "s"
  }`;

  if (minPrice === 0 && maxPrice === 0) {
    return `${ticketCountLabel} · Free`;
  }

  const priceLabel =
    minPrice === maxPrice
      ? numberWithCommas(maxPrice, true, null)
      : `${numberWithCommas(minPrice, true, null)} - ${numberWithCommas(
          maxPrice,
          true,
          null
        )}`;

  return `${ticketCountLabel} · ${priceLabel}`;
};

const formatParticipationSummary = ({
  registrationType,
  eventTickets,
  registrationFee,
  donationTarget
}: {
  registrationType?: string | null;
  eventTickets?: EventTicket[] | null;
  registrationFee?: string | number | null;
  donationTarget?: string | number | null;
}) => {
  if (registrationType === "ticket") {
    return formatTicketSummary(eventTickets);
  }

  if (registrationType === "registration") {
    const fee = Number(registrationFee || 0);
    return fee > 0 ? numberWithCommas(fee, true, null) : "Free RSVP";
  }

  if (registrationType === "donation") {
    const target = Number(donationTarget || 0);
    return target > 0
      ? `Target ${numberWithCommas(target / 100, true, null)}`
      : "Open donation";
  }

  if (registrationType === "volunteer") return "Volunteer places · no ticket required";

  return "Open invite";
};

const EventHeroChip = ({
  iconName,
  label,
  accent = "#0FF1CF"
}: {
  iconName: IoniconName;
  label: string;
  accent?: string;
}) => (
  <View
    style={[
      tw`max-w-full flex-row items-center rounded-full border px-3 py-2`,
      { backgroundColor: `${accent}18`, borderColor: `${accent}33` }
    ]}
  >
    <Ionicons name={iconName} size={14} color={accent} />
    <Text
      style={[tw`ml-2 shrink text-xs font-semibold`, { color: accent }]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

const EventInfoTile = ({
  iconName,
  title,
  subtitle,
  accent = "#0FF1CF",
  wide = false,
  onPress
}: {
  iconName: IoniconName;
  title: string;
  subtitle: string;
  accent?: string;
  wide?: boolean;
  onPress?: () => void;
}) => {
  const tileStyle = [
    tw`rounded-2xl border px-4 py-4`,
    wide ? tw`w-full` : tw`flex-1 min-w-[145px]`,
    { backgroundColor: "#0A173F", borderColor: `${accent}26` }
  ];

  const content = (
    <>
      <View
        style={[
          tw`h-9 w-9 items-center justify-center rounded-2xl`,
          { backgroundColor: `${accent}18` }
        ]}
      >
        <Ionicons name={iconName} size={18} color={accent} />
      </View>
      <Text style={tw`mt-3 text-xs uppercase text-[#87A0D6]`}>{title}</Text>
      <Text
        style={tw`mt-1 text-sm font-semibold leading-5 text-white`}
        numberOfLines={wide ? 3 : 2}
      >
        {subtitle}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.84}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${subtitle}`}
        onPress={onPress}
        style={tileStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={tileStyle}>{content}</View>;
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
    rule.fixedFeeWaiverBelowKobo &&
    chargedAmountKobo < rule.fixedFeeWaiverBelowKobo
      ? 0
      : rule.fixedFeeKobo || 0;
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
      chargeAmountNaira: grossAmountKobo / 100
    };
  }

  const buyerPlatformFeeKobo =
    config.feeBearers.platformFee === "BUYER"
      ? calculatePlatformFeeKobo(grossAmountKobo, config)
      : 0;

  let chargeAmountKobo = grossAmountKobo + buyerPlatformFeeKobo;

  if (config.feeBearers.providerFee === "BUYER") {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const estimatedFeeKobo = estimateProviderFeeKobo(
        provider,
        chargeAmountKobo,
        config
      );
      const nextChargeAmountKobo =
        grossAmountKobo + buyerPlatformFeeKobo + estimatedFeeKobo;

      if (nextChargeAmountKobo === chargeAmountKobo) {
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
    chargeAmountNaira: chargeAmountKobo / 100
  };
};

const EventPage = () => {
  const queryClient = useQueryClient();
  const { id, openFeed, feedTab, openPayoutSetup } = useLocalSearchParams<{
    id?: string | string[];
    openFeed?: string | string[];
    feedTab?: string | string[];
    openPayoutSetup?: string | string[];
  }>(); // eventId
  const { user } = useAuth();

  const eventId = Array.isArray(id) ? id[0] : id;
  const resolvedEventId = eventId || "";
  const rawFeedTab = Array.isArray(feedTab) ? feedTab[0] : feedTab;
  const initialFeedTab = rawFeedTab === "carpool" ? "carpool" : "feed";
  const shouldOpenFeedFromRoute =
    (Array.isArray(openFeed) ? openFeed[0] : openFeed) === "1";
  const shouldOpenPayoutSetup =
    (Array.isArray(openPayoutSetup) ? openPayoutSetup[0] : openPayoutSetup) ===
    "1";
  const router = useLockedRouter();

  const [selectedTickets, setSelectedTickets] = useState<GetTickets[]>([]);
  const [donationAmount, setDonationAmount] = useState<string>("500");
  const [donationMessage, setDonationMessage] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider>("PAYSTACK");
  const [showTransferInstructions, setShowTransferInstructions] =
    useState(false);
  const [transferInstructions, setTransferInstructions] =
    useState<PaymentInstructions | null>(null);
  const [checkoutDeadlineMs, setCheckoutDeadlineMs] = useState<number | null>(
    null
  );
  const transferCountdownSeconds = useCheckoutCountdown(checkoutDeadlineMs);
  const [showCreatorSetupModal, setShowCreatorSetupModal] = useState(false);
  const [showRegistrationCheckout, setShowRegistrationCheckout] =
    useState(false);
  const [showImpactReportModal, setShowImpactReportModal] = useState(false);
  const [impactReportSummary, setImpactReportSummary] = useState("");
  const [impactReportOutcomes, setImpactReportOutcomes] = useState<
    ImpactReportOutcomeDraft[]
  >([createEmptyImpactOutcome()]);
  const [impactReportEvidenceText, setImpactReportEvidenceText] = useState("");

  const { data, isPending, isError } = useEventDetails(resolvedEventId);
  const {
    registration: freeRegistration,
    isPending: checkingRegistration,
    isError: registrationCheckFailed,
    refetch: refreshRegistration,
  } = useFreeEventRegistration(data?.data);
  const hasFreeRegistration = Boolean(freeRegistration);
  const { data: onboardingData } = useWalletOnboarding({ enabled: !!user?.id });
  const hasEventEnded = useMemo(
    () => isEventPastEnd(data?.data?.startDate, data?.data?.endDate),
    [data?.data?.endDate, data?.data?.startDate]
  );
  const canEditEvent = useMemo(
    () => isEventEditableBeforeStartDay(data?.data?.startDate),
    [data?.data?.startDate]
  );

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
    getFeedStats // Get stats for animation
  } = useEventFeedConnection(resolvedEventId, true); // autoJoin = true

  const feedStats = getFeedStats();
  const [showFeed, setShowFeed] = useState(false);
  const [showVolunteerRoles, setShowVolunteerRoles] = useState(false);
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
    change: number
  ) => {
    if (!paymentOptions) return;
    const maximum = paymentOptions.maxTicketsPerCheckout;
    if (
      change > 0 &&
      selectedTickets.reduce((sum, item) => sum + item.quantity, 0) + change >
        maximum
    ) {
      showGlobalWarning(
        `You can reserve up to ${maximum} tickets per checkout.`
      );
      return;
    }

    setSelectedTickets((prevTickets) => {
      if (
        change > 0 &&
        prevTickets.reduce((sum, item) => sum + item.quantity, 0) + change >
          maximum
      )
        return prevTickets;
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
  const bottomSheetDonationRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  const closePaymentSelectionSurfaces = useCallback(() => {
    setShowRegistrationCheckout(false);
    bottomSheetRef.current?.dismiss?.();
    bottomSheetDonationRef.current?.dismiss?.();
  }, []);

  const closeEndedPaymentFlow = useCallback(() => {
    setShowFeed(false);
    closePaymentSelectionSurfaces();
    showGlobalWarning(
      "This event has ended. Ticketing, registration, and donations are closed."
    );
  }, [closePaymentSelectionSurfaces]);

  const closeEndedCarpoolFlow = useCallback(() => {
    setShowFeed(false);
    showGlobalWarning(
      "This event has ended. Ride creation and joining are closed."
    );
  }, []);

  const openSheet = useCallback(() => {
    if (hasEventEnded) {
      closeEndedPaymentFlow();
      return;
    }

    setShowFeed(false);
    setTimeout(() => bottomSheetRef.current?.present?.(), 120);
  }, [closeEndedPaymentFlow, hasEventEnded]);

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
  const ticketTotal = selectedTickets.reduce((total, selected) => {
    const ticket = data!.data.eventTickets.find(
      (ticket) => ticket.id === selected.id
    )!;
    return total + selected.quantity * (ticket.updatedPrice ?? ticket.price);
  }, 0);
  const ticketPreview = useMemo(
    () =>
      buildCheckoutPreview(
        ticketTotal,
        selectedProvider,
        paymentOptions?.pricingConfig
      ),
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
    if (hasEventEnded) {
      closeEndedPaymentFlow();
      return;
    }

    setShowFeed(false);
    setTimeout(() => bottomSheetDonationRef.current?.present?.(), 120);
  }, [closeEndedPaymentFlow, hasEventEnded]);

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
      (paymentOptions?.requiresPayment || paymentOptions?.acceptsDonations) &&
      onboarding?.showPersistentAlert
    ) {
      setShowCreatorSetupModal(true);
    }
  }, [
    isOwner,
    onboarding?.showPersistentAlert,
    paymentOptions?.requiresPayment,
    paymentOptions?.acceptsDonations,
    shouldOpenPayoutSetup
  ]);

  useEffect(() => {
    if (transferCountdownSeconds !== 0 || !currentTransactionId) return;
    setShowTransferInstructions(false);
    setShowPaystackWebView(false);
    router.push(`/transaction/${currentTransactionId}?type=${transactionType}`);
  }, [transferCountdownSeconds, currentTransactionId, router, transactionType]);

  const handleProviderInitSuccess = useCallback(
    (
      payload: GetTicketsResponse | DonationResponse,
      type: "DONATION" | "REGISTRATION" | "TICKET"
    ) => {
      setCurrentTransactionId(payload.data.transactionId);
      setCheckoutDeadlineMs(
        "checkoutDeadlineMs" in payload.data
          ? payload.data.checkoutDeadlineMs
          : null
      );
      setTransactionType(type);
      closePaymentSelectionSurfaces();

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
    [closePaymentSelectionSurfaces, router]
  );

  const renderProviderSelector = useCallback(
    (
      baseAmountNaira: number,
      accent: "teal" | "red" = "teal",
      title = "Choose payment method"
    ) => {
      if (!paymentOptions || paymentOptions.availableProviders.length === 0 || baseAmountNaira <= 0) {
        return null;
      }

      const providerPreviews = paymentOptions.availableProviders.map(
        (provider) => ({
          provider,
          preview: buildCheckoutPreview(
            baseAmountNaira,
            provider,
            paymentOptions.pricingConfig
          )
        })
      );
      const selectedPreview = buildCheckoutPreview(
        baseAmountNaira,
        selectedProvider,
        paymentOptions.pricingConfig
      );
      const accentBg = accent === "red" ? "bg-[#FF6B6B]" : "bg-[#0FF1CF]";
      const accentText = accent === "red" ? "text-[#FF9D9D]" : "text-[#0FF1CF]";

      return (
        <View style={tw`rounded-2xl bg-[#101C45] p-3`}>
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <Text style={tw`flex-1 text-sm font-semibold text-white`}>
              {title}
            </Text>
            <Text style={tw.style("text-sm font-bold", accentText)}>
              {formatCheckoutAmount(selectedPreview.chargeAmountNaira)}
            </Text>
          </View>
          <Text style={tw`mt-1 text-xs leading-5 text-gray-400`}>
            {selectedProvider === "ALAT_TRANSFER"
              ? "Transfer instructions appear after you confirm."
              : "Secure checkout powered by Paystack."}
          </Text>

          <View style={tw`mt-3 flex-row flex-wrap gap-2`}>
            {providerPreviews.map(({ provider, preview }) => {
              const selected = provider === selectedProvider;

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
                      selected ? "text-[#01082E]" : "text-gray-400"
                    )}
                  >
                    {PROVIDER_LABELS[provider]}
                  </Text>
                  <Text
                    style={tw.style(
                      "mt-1 text-sm font-bold",
                      selected ? "text-[#01082E]" : "text-white"
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
              isImageProcessing: false
            }
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

      handleProviderInitSuccess(response, "TICKET");
    },
    onError: (error) => {
      console.log(error);
      const details = error.response?.data as
        | { transactionId?: string; message?: string }
        | undefined;
      if (details?.transactionId) {
        router.push(`/transaction/${details.transactionId}`);
        return;
      }
      showGlobalError(
        details?.message ||
          "Could not start checkout. Retry to resume your request."
      );
    }
  });

  const { mutateAsync: registerEvent, isPending: registeringEvent } =
    useRegisterEvent({
      onSuccess: (response) => {
        showGlobalSuccess("Checkout started successfully.");
        handleProviderInitSuccess(response, "REGISTRATION");
      },
      onError: (error) => {
        console.log(error);
        const details = error.response?.data as
          | { transactionId?: string; message?: string }
          | undefined;
        if (details?.transactionId) {
          router.push(
            `/transaction/${details.transactionId}?type=REGISTRATION`
          );
          return;
        }
        showGlobalError(
          details?.message ||
            "Could not start checkout. Retry to resume your request."
        );
      }
    });

  const registrationDisabled =
    registeringEvent || checkingRegistration || hasFreeRegistration;

  const { mutateAsync: initiateDonation, isPending: initiatingDonation } =
    useInitiateDonation({
      onSuccess: (response: DonationResponse) => {
        showGlobalSuccess("Donation initiated successfully.");
        handleProviderInitSuccess(response, "DONATION");
      },
      onError: (error) => {
        console.error("Donation initiation failed:", error);

        showGlobalError("Failed to initiate donation");
      }
    });

  const { mutateAsync: upsertImpactReport, isPending: submittingImpactReport } =
    useUpsertEventImpactReport(resolvedEventId, {
      onSuccess: () => {
        setShowImpactReportModal(false);
        showGlobalSuccess("Impact report published.");
      },
      onError: (error) => {
        console.error("Impact report submission failed:", error);
        showGlobalError("Failed to publish impact report");
      }
    });

  const handleTransaction = useCallback(
    async (isRegistration?: boolean) => {
      if (hasEventEnded) {
        closeEndedPaymentFlow();
        return;
      }

      if (isRegistration && registrationDisabled) return;
      if (isRegistration && registrationCheckFailed) {
        await refreshRegistration();
        return;
      }

      if (!user) return;
      const intent = isRegistration
        ? JSON.stringify({ type: "REGISTRATION", provider: selectedProvider })
        : JSON.stringify({
            type: "TICKET",
            provider: selectedProvider,
            items: [...selectedTickets]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map(({ id, quantity }) => ({ id, quantity }))
          });
      const idempotencyKey = await checkoutIntentKey(
        user.id,
        resolvedEventId,
        intent
      );
      if (isRegistration) {
        await registerEvent({
          idempotencyKey,
          eventId: resolvedEventId,
          provider: selectedProvider,
          platform: "mobile"
        });
        return;
      }

      await mutateAsync({
        idempotencyKey,
        items: selectedTickets,
        provider: selectedProvider,
        clientContext: {
          platform: "mobile"
        }
      });
    },
    [
      closeEndedPaymentFlow,
      hasEventEnded,
      mutateAsync,
      registerEvent,
      registrationDisabled,
      registrationCheckFailed,
      refreshRegistration,
      resolvedEventId,
      selectedProvider,
      selectedTickets,
      user
    ]
  );

  const handleRegisterPress = useCallback(() => {
    if (hasEventEnded) {
      closeEndedPaymentFlow();
      return;
    }

    if (registrationFeeAmount > 0 && paymentOptions?.requiresPayment) {
      setShowRegistrationCheckout(true);
      return;
    }

    handleTransaction(true);
  }, [
    closeEndedPaymentFlow,
    handleTransaction,
    hasEventEnded,
    paymentOptions?.requiresPayment,
    registrationFeeAmount
  ]);

  const handleDonation = async () => {
    if (hasEventEnded) {
      closeEndedPaymentFlow();
      return;
    }

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
          platform: "mobile"
        }
      });
    } catch (error) {
      console.error("Donation error:", error);
    }
  };

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Gather with me on GatherGo 👉 ${buildEventShareLink(
          resolvedEventId
        )}`
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  }, [resolvedEventId]);

  const handleFeedAction = useCallback(
    (action: { type?: string; label?: string; carpoolId?: string }) => {
      const actionType = action?.type?.toUpperCase();
      const actionLabel = action?.label?.toUpperCase();
      const normalized = actionType || actionLabel;
      if (!normalized) return;
      if (normalized.includes("VOLUNTEER")) {
        setShowFeed(false);
        setShowVolunteerRoles(true);
        return;
      }
      const isPaymentAction =
        normalized.includes("TICKET") ||
        normalized.includes("DONAT") ||
        normalized.includes("REGISTER");

      if (isPaymentAction && hasEventEnded) {
        closeEndedPaymentFlow();
        return;
      }

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

      const isCarpoolAction =
        normalized.includes("OPEN_CARPOOL") ||
        normalized.includes("CREATE_CARPOOL");

      if (isCarpoolAction && hasEventEnded) {
        closeEndedCarpoolFlow();
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
          params: { eventId: resolvedEventId, autoOpenEventPicker: "1" }
        });
      }
    },
    [
      closeEndedCarpoolFlow,
      closeEndedPaymentFlow,
      data?.data?.isPhysicalEvent,
      handleRegisterPress,
      handleShare,
      hasEventEnded,
      openDonationSheet,
      openSheet,
      resolvedEventId,
      router
    ]
  );

  const { mutateAsync: followPooler, isPending: isFollowing } = useFollowUser({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.eventDetails, data?.data.id]
      });
      showGlobalSuccess("User followed");
    },
    onError: () => {}
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
        followingId: creator.id
      });
    } else {
    }
  };

  if (isPending) {
    return (
      <View style={[tw`flex-1 bg-[#01082E]`, { paddingTop: spacing.xxl }]}>
        <CustomView className={`px-3`}>
          <CustomeTopBarNav
            title="Event Details"
            onClickBack={() => router.replace("/")}
          />
        </CustomView>
        <ImpactPageLoader
          title="Loading event"
          message="Loading event details, tickets, and travel options."
        />
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
    impactSdgGoals,
    impactPaths,
    impactCommitments,
    impactReport,
    imageUrl,
    startDate,
    endDate,
    isPhysicalEvent,
    links,
    location,
    eventTickets,
    creator,
    registrationFee,
    registrationType
  } = data?.data;

  const publishedTickets = eventTickets.filter((ticket) => ticket.isVisible);
  const eventDateTime = formatEventDateTime(startDate, endDate);
  const impactSummary = impactTitle?.trim() || null;
  const impactNote = impactDescription?.trim() || "";
  const persistedImpactMap = normalizePersistedImpactMap({
    impactSdgGoals,
    impactPaths,
    impactCommitments
  });
  const selectedSdgGoals = persistedImpactMap.sdgGoals;
  const selectedImpactPaths = persistedImpactMap.impactPaths;
  const selectedCommitments = persistedImpactMap.commitments;
  const eventLinks = links || [];
  const eventTone = getEventTone(registrationType);
  const eventModeLabel =
    isPhysicalEvent === false ? "Online gathering" : "In-person gathering";
  const locationLabel =
    isPhysicalEvent === false
      ? "No physical meetup"
      : location || "Venue to be announced";
  const participationSummary = formatParticipationSummary({
    registrationType,
    eventTickets,
    registrationFee,
    donationTarget: data.data.donationTarget
  });
  const heroImpactGoal = selectedSdgGoals[0];
  const heroImpactLabel = heroImpactGoal?.shortTitle || impactSummary;
  const reportedOutcomes = Array.isArray(impactReport?.outcomes)
    ? impactReport.outcomes
    : [];
  const reportedEvidenceLinks = Array.isArray(impactReport?.evidenceLinks)
    ? impactReport.evidenceLinks
    : [];
  const impactReportPublishedDate = formatImpactReportDate(
    impactReport?.publishedAt || impactReport?.updatedAt
  );

  const openImpactReportModal = () => {
    setImpactReportSummary(impactReport?.summary || "");
    setImpactReportOutcomes(
      reportedOutcomes.length
        ? reportedOutcomes.map((outcome) => ({
            id: outcome.id,
            type: outcome.type,
            label: outcome.label,
            value: String(outcome.value),
            unit: outcome.unit,
            note: outcome.note || ""
          }))
        : selectedCommitments.length
          ? selectedCommitments.map((commitment) => ({
              id: commitment.id,
              type: commitment.type,
              label: commitment.label,
              value: String(commitment.value),
              unit: commitment.unit,
              note: ""
            }))
          : [createEmptyImpactOutcome()]
    );
    setImpactReportEvidenceText(reportedEvidenceLinks.join("\n"));
    setShowImpactReportModal(true);
  };

  const updateImpactReportOutcome = (
    index: number,
    updates: Partial<ImpactReportOutcomeDraft>
  ) => {
    setImpactReportOutcomes((current) =>
      current.map((outcome, outcomeIndex) =>
        outcomeIndex === index ? { ...outcome, ...updates } : outcome
      )
    );
  };

  const removeImpactReportOutcome = (index: number) => {
    setImpactReportOutcomes((current) =>
      current.length <= 1
        ? current
        : current.filter((_, outcomeIndex) => outcomeIndex !== index)
    );
  };

  const addImpactReportOutcome = () => {
    setImpactReportOutcomes((current) => [
      ...current,
      createEmptyImpactOutcome()
    ]);
  };

  const buildImpactReportPayload =
    (): UpsertEventImpactReportPayload | null => {
      const summary = impactReportSummary.trim();
      const outcomes: EventImpactReportOutcome[] = impactReportOutcomes
        .map((outcome, index) => {
          const label = outcome.label.trim();
          const value = Number(outcome.value);
          const unit = outcome.unit.trim();
          const type = outcome.type?.trim() || buildOutcomeType(label);
          const note = outcome.note?.trim();

          return {
            id: outcome.id || `${type}_${value}_${index}`,
            type,
            label,
            value,
            unit,
            ...(note ? { note } : {})
          };
        })
        .filter(
          (outcome) =>
            outcome.label &&
            outcome.unit &&
            Number.isFinite(outcome.value) &&
            outcome.value >= 0
        );

      if (summary.length < 10) {
        showGlobalError("Add a short summary of the event impact.");
        return null;
      }

      if (!outcomes.length) {
        showGlobalError("Add at least one reported outcome.");
        return null;
      }

      return {
        summary,
        outcomes,
        evidenceLinks: parseEvidenceLinks(impactReportEvidenceText)
      };
    };

  const submitImpactReport = async () => {
    const payload = buildImpactReportPayload();
    if (!payload) return;

    await upsertImpactReport(payload);
  };

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
        { paddingTop: spacing.xxl }
      ]}
    >
      <CustomView style={tw`flex-1`}>
        <CustomView style={tw`px-3`}>
          <CustomeTopBarNav
            title="Event Details"
            onClickBack={() => safeGoBack(router, "/")}
          />
        </CustomView>

        <ScrollView
          style={tw`w-full`}
          contentContainerStyle={tw`max-w-[500px] pb-4`}
        >
          <View style={tw`px-4 pt-2`}>
            <View
              style={[
                tw`overflow-hidden rounded-[32px] border bg-[#07143B]`,
                { borderColor: `${eventTone.accent}33` }
              ]}
            >
              <View style={tw`relative`}>
                <EventImageWithProcessing
                  imageUrl={imageUrl}
                  isProcessing={data.data.isImageProcessing}
                  height={285}
                  registrationType={registrationType}
                />
                <View style={tw`absolute left-4 right-20 top-4 flex-row`}>
                  <EventHeroChip
                    iconName={eventTone.iconName}
                    label={eventTone.label}
                    accent={eventTone.accent}
                  />
                </View>
                <View
                  style={tw`absolute bottom-0 left-0 right-0 bg-[#01082E]/82 px-5 pb-5 pt-8`}
                >
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    <EventHeroChip
                      iconName={
                        isPhysicalEvent === false
                          ? "wifi-outline"
                          : "location-outline"
                      }
                      label={eventModeLabel}
                      accent="#31C6F6"
                    />
                    {heroImpactLabel && (
                      <EventHeroChip
                        iconName="leaf-outline"
                        label={heroImpactLabel}
                        accent={heroImpactGoal?.color || "#F8D05C"}
                      />
                    )}
                  </View>
                  <View style={tw`mt-4 flex-row items-end gap-3`}>
                    <Text
                      style={tw`flex-1 text-2xl font-bold leading-8 text-white`}
                      numberOfLines={3}
                    >
                      {title}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.84}
                      accessibilityRole="button"
                      accessibilityLabel="Share event"
                      onPress={handleShare}
                      style={tw`h-12 w-12 items-center justify-center rounded-full bg-[#0FF1CF] border border-white/15`}
                    >
                      <Share2Icon color="#01082E" size={19} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={tw`gap-4 p-5`}>
                {(data.data.donationsEnabled || data.data.totalDonations > 0) && (
                  <DontationProgress
                    donationTarget={data.data.donationTarget}
                    totalDonations={data.data.totalDonations}
                  />
                )}
                {data.data.donationsEnabled && registrationType === "volunteer" && !hasEventEnded ? (
                  <CustomButton showArrow={false} title="Support with a donation" onPress={openDonationSheet}
                    buttonClassName="w-full border-[#FF6B6B]" textClassName="text-[#FF9D9D]" />
                ) : null}

                <View style={tw`flex-row flex-wrap gap-3`}>
                  <EventInfoTile
                    iconName="calendar-outline"
                    title="When"
                    subtitle={eventDateTime}
                    accent="#0FF1CF"
                  />
                  <EventInfoTile
                    iconName={eventTone.iconName}
                    title={
                      data.data.registrationType === "donation"
                        ? "Target"
                        : "Access"
                    }
                    subtitle={participationSummary}
                    accent={eventTone.accent}
                  />
                  <EventInfoTile
                    iconName={
                      isPhysicalEvent === false
                        ? "desktop-outline"
                        : "map-outline"
                    }
                    title="Where"
                    subtitle={locationLabel}
                    accent="#31C6F6"
                    wide
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={tw`px-5 pt-4`}>
            <EventVolunteering
              event={data.data}
              owner={owner}
              onPress={() => setShowVolunteerRoles(true)}
            />
          </View>

          {hasEventEnded && (
            <CustomView style={tw`px-4 pt-4`}>
              <View
                style={tw`rounded-[24px] border border-[#24345A] bg-[#0A173F] p-4`}
              >
                <Text style={tw`text-sm font-semibold text-[#F1D417]`}>
                  This event has ended
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#C6D5F2]`}>
                  You can still review the event details, updates, organizer
                  profile, and related links here.
                </Text>
              </View>
            </CustomView>
          )}

          <CustomView style={tw`px-5 pt-4`}>
            <Text style={tw`text-xl font-semibold text-white`}>
              About this event
            </Text>
            <Text style={tw`mt-3 text-sm leading-6 text-[#DDE6FF]`}>
              {description}
            </Text>
          </CustomView>

          {(impactSummary ||
            impactNote ||
            selectedSdgGoals.length > 0 ||
            selectedImpactPaths.length > 0 ||
            selectedCommitments.length > 0) && (
            <CustomView style={tw`px-4 pt-4`}>
              <View
                style={tw`rounded-[28px] border border-[#1B2A50] bg-[#101C45] p-5`}
              >
                <View style={tw`flex-row items-start justify-between gap-3`}>
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                    >
                      Impact story
                    </Text>
                    <Text style={tw`mt-2 text-xl font-semibold text-white`}>
                      {impactSummary || "From the organiser"}
                    </Text>
                    <Text style={tw`mt-3 text-sm leading-6 text-[#DDE6FF]`}>
                      {impactNote}
                    </Text>
                  </View>
                  {selectedSdgGoals[0] ? (
                    <View
                      style={[
                        tw`h-11 w-11 items-center justify-center rounded-full`,
                        { backgroundColor: selectedSdgGoals[0].color }
                      ]}
                    >
                      <SdgGoalIcon
                        number={selectedSdgGoals[0].number}
                        color="white"
                        size={23}
                      />
                    </View>
                  ) : (
                    <View style={tw`rounded-full bg-[#0FF1CF] px-3 py-2`}>
                      <Text style={tw`text-sm font-bold text-[#01082E]`}>
                        Impact
                      </Text>
                    </View>
                  )}
                </View>

                {(selectedSdgGoals.length > 0 ||
                  selectedImpactPaths.length > 0 ||
                  selectedCommitments.length > 0) && (
                  <View style={tw`mt-4 flex-row flex-wrap gap-2`}>
                    {selectedSdgGoals.map((goal) => (
                      <View
                        key={goal.id}
                        style={tw`flex-row items-center rounded-full bg-[#0A173F] pr-3`}
                      >
                        <View
                          style={[
                            tw`h-7 w-7 items-center justify-center rounded-full`,
                            { backgroundColor: goal.color }
                          ]}
                        >
                          <SdgGoalIcon
                            number={goal.number}
                            color="white"
                            size={14}
                          />
                        </View>
                        <Text style={tw`ml-2 text-xs font-semibold text-white`}>
                          {goal.shortTitle}
                        </Text>
                      </View>
                    ))}

                    {selectedCommitments.map((commitment) => (
                      <View
                        key={commitment.id}
                        style={tw`rounded-full bg-[#F4B942]/10 px-3 py-2`}
                      >
                        <Text style={tw`text-xs font-semibold text-[#FFE5A0]`}>
                          {commitment.label}
                        </Text>
                      </View>
                    ))}

                    {selectedImpactPaths.map((mechanism) => (
                      <View
                        key={mechanism.id}
                        style={tw`rounded-full bg-[#0FF1CF]/10 px-3 py-2`}
                      >
                        <Text style={tw`text-xs font-semibold text-[#B7FFF5]`}>
                          {mechanism.summaryLabel}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </CustomView>
          )}
          {hasEventEnded && (impactReport || owner) && (
            <CustomView style={tw`px-5 pb-4`}>
              <View
                style={tw`rounded-3xl border border-[#1D3B64] bg-[#08143B] p-4`}
              >
                <View style={tw`flex-row items-start justify-between gap-3`}>
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                    >
                      Reported impact
                    </Text>
                    {impactReportPublishedDate && (
                      <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                        Published {impactReportPublishedDate}
                      </Text>
                    )}
                  </View>

                  {owner && (
                    <TouchableOpacity
                      onPress={openImpactReportModal}
                      style={tw`rounded-full bg-[#0FF1CF] px-3 py-2`}
                    >
                      <Text style={tw`text-xs font-bold text-[#01082E]`}>
                        {impactReport ? "Edit" : "Submit"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {impactReport ? (
                  <>
                    <Text style={tw`mt-4 text-sm leading-6 text-white`}>
                      {impactReport.summary}
                    </Text>

                    {reportedOutcomes.length > 0 && (
                      <View style={tw`mt-4 flex-row flex-wrap gap-3`}>
                        {reportedOutcomes.map((outcome, index) => (
                          <View
                            key={outcome.id || `${outcome.type}-${index}`}
                            style={tw`min-w-[130px] flex-1 rounded-2xl bg-[#101C45] p-3`}
                          >
                            <Text style={tw`text-xl font-bold text-[#0FF1CF]`}>
                              {numberWithCommas(outcome.value, false, null)}
                            </Text>
                            <Text
                              style={tw`mt-1 text-xs uppercase text-[#8FA1CB]`}
                            >
                              {outcome.unit}
                            </Text>
                            <Text
                              style={tw`mt-2 text-sm font-semibold text-white`}
                            >
                              {outcome.label}
                            </Text>
                            {outcome.note ? (
                              <Text
                                style={tw`mt-1 text-xs leading-5 text-[#B7C5E9]`}
                              >
                                {outcome.note}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    )}

                    {reportedEvidenceLinks.length > 0 && (
                      <View style={tw`mt-4 gap-2`}>
                        <Text
                          style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                        >
                          Evidence
                        </Text>
                        {reportedEvidenceLinks.map((link, index) => (
                          <TouchableOpacity
                            key={`${link}-${index}`}
                            onPress={() => handleOpenEventLink(link)}
                            style={tw`rounded-2xl bg-[#0A173F] px-4 py-3`}
                          >
                            <Text
                              style={tw`text-sm font-semibold text-[#0FF1CF]`}
                            >
                              {link}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={tw`mt-4 text-sm leading-6 text-[#C6D5F2]`}>
                    Share what actually happened after this event: outcomes,
                    numbers, and links people can trust.
                  </Text>
                )}
              </View>
            </CustomView>
          )}
          <CustomView style={tw`px-4 pt-4`}>
            <View
              style={tw`rounded-[28px] border border-[#1B2A50] bg-[#07143B] p-5`}
            >
              <View style={tw`flex-row items-center justify-between gap-3`}>
                <View style={tw`flex-1 min-w-0 flex-row items-center gap-3`}>
                  <View
                    style={tw`h-11 w-11 items-center justify-center rounded-2xl bg-[#0FF1CF]/12`}
                  >
                    <Ionicons name="planet-outline" size={22} color="#0FF1CF" />
                  </View>
                  <View style={tw`flex-1 min-w-0`}>
                    <Text
                      style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                    >
                      Event essentials
                    </Text>
                    <Text style={tw`mt-1 text-base font-semibold text-white`}>
                      The quick read before you move.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={tw`mt-4 flex-row flex-wrap gap-3`}>
                <EventInfoTile
                  iconName="calendar-outline"
                  title="Date & time"
                  subtitle={eventDateTime}
                  accent="#0FF1CF"
                />
                <EventInfoTile
                  iconName={eventTone.iconName}
                  title={eventTone.label}
                  subtitle={participationSummary}
                  accent={eventTone.accent}
                />
                <EventInfoTile
                  iconName={
                    isPhysicalEvent === false
                      ? "desktop-outline"
                      : "map-outline"
                  }
                  title="Location"
                  subtitle={locationLabel}
                  accent="#31C6F6"
                  wide
                />
                <EventInfoTile
                  iconName="share-social-outline"
                  title="Share"
                  subtitle="Send this GatherGo link."
                  accent="#F8D05C"
                  onPress={handleShare}
                />
              </View>
            </View>
          </CustomView>
          {eventLinks.length > 0 && (
            <CustomView style={tw`px-4 pt-4`}>
              <View
                style={tw`rounded-[28px] border border-[#1B2A50] bg-[#101C45] p-5`}
              >
                <Text
                  style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                >
                  Event links
                </Text>

                <View style={tw`mt-4 gap-3`}>
                  {eventLinks.map((link, index) => {
                    const linkMeta = getEventLinkMeta(link);

                    return (
                      <TouchableOpacity
                        key={`${link}-${index}`}
                        activeOpacity={0.84}
                        style={tw`rounded-2xl border border-[#1B2A50] bg-[#0A173F] px-4 py-4`}
                        onPress={() => handleOpenEventLink(link)}
                      >
                        <View style={tw`flex-row items-center`}>
                          <View
                            style={[
                              tw`h-12 w-12 items-center justify-center rounded-2xl`,
                              { backgroundColor: linkMeta.backgroundColor }
                            ]}
                          >
                            <Ionicons
                              name={linkMeta.icon}
                              size={20}
                              color={linkMeta.iconColor}
                            />
                          </View>

                          <View style={tw`ml-3 flex-1`}>
                            <Text
                              style={tw`text-base font-semibold text-white`}
                            >
                              {linkMeta.label}
                            </Text>
                            <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                              {linkMeta.host || linkMeta.subtitle}
                            </Text>
                          </View>

                          <Ionicons
                            name="open-outline"
                            size={18}
                            color="#0FF1CF"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </CustomView>
          )}
          {owner &&
            onboarding?.showPersistentAlert &&
            (paymentOptions?.requiresPayment || paymentOptions?.acceptsDonations) && (
              <CustomView style={tw`px-4 pt-4`}>
                <View
                  style={tw`rounded-[24px] border border-[#F1D417] bg-[#1B2A50] p-4`}
                >
                  <Text style={tw`text-sm font-bold text-[#F1D417]`}>
                    Payout setup still needs attention
                  </Text>
                  <Text style={tw`mt-2 text-sm leading-5 text-white`}>
                    {onboarding.nextAction === "ADD_SETTLEMENT_ACCOUNT"
                      ? "Add your settlement account so we know where to pay your earnings."
                      : onboarding.nextAction === "COMPLETE_KYC"
                        ? "Complete identity verification so your earnings can be released."
                        : "We are still preparing ALAT transfer for this creator account."}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCreatorSetupModal(true)}
                    style={tw`mt-4 rounded-full bg-[#0FF1CF] px-4 py-3`}
                  >
                    <Text
                      style={tw`text-center text-sm font-semibold text-[#01082E]`}
                    >
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
              <View style={tw`flex-row items-center gap-2`}>
                <VolunteerButton
                  event={data.data}
                  hasEventEnded={hasEventEnded}
                  purpose="manage"
                  variant="icon"
                  onPress={() =>
                    router.push({
                      pathname: "/volunteers/[id]",
                      params: { id: resolvedEventId }
                    })
                  }
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Edit event"
                  style={[
                    tw`p-3 rounded-lg`,
                    !canEditEvent ? tw`opacity-40` : null
                  ]}
                  onPress={() => {
                    if (!canEditEvent) {
                      showGlobalWarning(
                        "Events can no longer be edited on the day they start."
                      );
                      return;
                    }

                    router.push(`/event/edit/${resolvedEventId}`);
                  }}
                >
                  <Edit2Icon color="#0FF1CF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={tw`px-5 w-full max-w-[500px]`}>
          {hasEventEnded ? (
            <CustomButton
              disabled
              onPress={() => {}}
              showArrow={false}
              buttonClassName="bg-[#1B2A50] border border-[#2B3C66] w-full"
              textClassName="!text-[#8FA1CB]"
              title="Event ended"
            />
          ) : registrationType === "ticket" ? (
            <CustomButton
              onPress={openSheet}
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] border-0 w-full"
              textClassName="!text-black shrink"
              title="View tickets"
            />
          ) : registrationType === "registration" ? (
            <CustomButton
              onPress={handleRegisterPress}
              disabled={registrationDisabled}
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] border-0 w-full"
              textClassName="!text-black shrink"
              title={
                checkingRegistration
                  ? "Checking registration…"
                  : registeringEvent
                    ? "Registering…"
                    : hasFreeRegistration
                      ? "Registered"
                      : registrationCheckFailed
                        ? "Retry registration check"
                        : "Register"
              }
            />
          ) : registrationType === "donation" ? (
            <CustomButton
              onPress={openDonationSheet}
              showArrow={false}
              buttonClassName="bg-[#FF6B6B] border-0 w-full"
              textClassName="!text-white shrink"
              title="Donate Now"
            />
          ) : !owner ? (
            <VolunteerButton
              event={data.data}
              hasEventEnded={hasEventEnded}
              variant="primary"
              onPress={() => setShowVolunteerRoles(true)}
            />
          ) : null}
        </View>
      </CustomView>

      {/* Companion feed button */}
      <View
        pointerEvents={showFeed ? "none" : "box-none"}
        style={[tw`absolute inset-0`, showFeed ? tw`z-0 opacity-0` : tw`z-20`]}
      >
        <FlameFeedButton
          frenzyLevel={getFeedFrenzyLevel(allFeeds)}
          unreadCount={feedStats.totalCount}
          onPress={() => setShowFeed(true)}
          disabled={showFeed}
          supportsCarpool={isPhysicalEvent !== false && !hasEventEnded}
        />
      </View>

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
          <Text style={tw`text-white`}>
            {publishedTickets.length > 0 ? "BUY TICKET" : "Tickets"}
          </Text>
          <View style={tw`flex-row items-center gap-3`}>
            {publishedTickets.length > 0 ? (
              <AnimatedNumber value={ticketTotal} />
            ) : null}
            <SheetCloseButton
              onPress={() => bottomSheetRef.current?.dismiss()}
            />
          </View>
        </View>

        <BottomSheetScrollView
          style={tw`p-5`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            publishedTickets.length === 0
              ? tw`grow justify-center pb-10`
              : undefined
          }
        >
          {publishedTickets.length === 0 ? (
            <MascotMoment
              variant="empty"
              layout="stacked"
              title="Tickets aren't live yet"
              message="The organiser hasn't published tickets for this event. Check back here soon."
              typing={false}
            />
          ) : (
            <View style={tw`py-5 gap-5`}>
              {publishedTickets.map((ticket) => (
                <PricingCard
                  key={ticket.id}
                  selectedQuantity={
                    selectedTickets.find((item) => item.id === ticket.id)
                      ?.quantity ?? 0
                  }
                  canIncrease={
                    paymentOptions !== undefined &&
                    selectedTickets.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    ) < paymentOptions.maxTicketsPerCheckout
                  }
                  onQuantityChange={(change) =>
                    handleTicketSelection(ticket.id, ticket.type, change)
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
          )}
        </BottomSheetScrollView>

        {publishedTickets.length > 0 ? (
          <View style={tw`w-full max-w-[500px] gap-3 p-5`}>
            {renderProviderSelector(ticketTotal)}
            <CustomButton
              onPress={() => handleTransaction(false)}
              disabled={
                hasEventEnded || selectedTickets.length === 0 || gettingTickets
              }
              title={
                hasEventEnded
                  ? "Event ended"
                  : gettingTickets
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
        ) : null}
      </BottomSheetModal>

      <Modal
        visible={showRegistrationCheckout}
        transparent
        animationType="slide"
      >
        <View style={tw`flex-1 justify-end bg-black/60 px-5 py-8`}>
          <View style={tw`rounded-[28px] bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <View>
                <Text style={tw`text-xl font-bold text-white`}>
                  Complete registration
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

            <View style={tw`mt-5 gap-4`}>
              <View style={tw`rounded-2xl bg-[#08143B] p-4`}>
                <Text
                  style={tw`text-xs uppercase tracking-widest text-[#8FA1CB]`}
                >
                  Registration total
                </Text>
                <Text style={tw`mt-2 text-2xl font-bold text-white`}>
                  {formatCheckoutAmount(registrationPreview.chargeAmountNaira)}
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#B7C5E9]`}>
                  This registration will be issued to your GatherGo account.
                </Text>
              </View>

              <CustomButton
                onPress={() => {
                  setShowRegistrationCheckout(false);
                  handleTransaction(true);
                }}
                disabled={hasEventEnded || registrationDisabled}
                buttonClassName="bg-[#0FF1CF] border-0 w-full"
                textClassName="!text-black"
                arrowCircleColor="bg-[#0C7F7F]"
                title={
                  hasEventEnded
                    ? "Event ended"
                    : registeringEvent
                      ? "Registering"
                      : `Register for ${formatCheckoutAmount(
                          registrationPreview.chargeAmountNaira
                        )}`
                }
              />
            </View>
          </View>
        </View>
        <AppToast />
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
                        ? "text-[#01082E] font-bold"
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
                <Text style={tw`text-[#01082E] text-sm`}>Min</Text>
              </TouchableOpacity>
            </View>

            {parseFloat(donationAmount || "0") < 500 && (
              <Text style={tw`text-red-500 text-sm mt-2`}>
                Minimum donation is ₦500
              </Text>
            )}
          </CustomView>

          <CustomView style={tw`mb-6`}>
            <Text style={tw`text-white mb-3 font-medium`}>
              Optional Message (Optional)
            </Text>
            <BottomSheetTextInput
              autoCapitalize="none"
              style={tw`bg-[#101C45] rounded-xl px-4 py-3 text-white min-h-[100px]`}
              value={donationMessage}
              onChangeText={setDonationMessage}
              placeholder="Add a message of support..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
                    <Ionicons name="checkmark" size={16} color="#01082E" />
                  )}
                </View>
                <View>
                  <Text style={tw`text-white font-medium`}>
                    Donate anonymously
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

          {renderProviderSelector(
            Number(parseFloat(donationAmount || "0") || 0),
            "red"
          )}

          <CustomView style={tw`mb-7`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="shield-checkmark" size={20} color="#0FF1CF" />
              <Text style={tw`text-white ml-2 text-sm`}>
                {selectedProvider === "ALAT_TRANSFER"
                  ? "Bank transfer checkout via ALAT"
                  : "Secure payment powered by Paystack"}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="information-circle" size={20} color="#0FF1CF" />
              <Text style={tw`text-white ml-2 text-sm`}>
                {selectedProvider === "ALAT_TRANSFER"
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
              hasEventEnded ||
              initiatingDonation ||
              parseFloat(donationAmount || "0") < 500
            }
            buttonClassName="bg-[#FF6B6B] w-full border-0"
            textClassName="!text-white"
            showArrow={false}
            title={
              hasEventEnded
                ? "Event ended"
                : initiatingDonation
                  ? "Processing..."
                  : `Donate ${formatCheckoutAmount(
                      donationPreview.chargeAmountNaira
                    )}`
            }
          />
        </View>
      </BottomSheetModal>
      {showVolunteerRoles ? (
        <VolunteerRolesSheet
          event={data.data}
          owner={owner}
          onClose={() => setShowVolunteerRoles(false)}
        />
      ) : null}
      <FeedBottomSheet
        eventId={resolvedEventId}
        isVisible={showFeed}
        hasEventEnded={hasEventEnded}
        onClose={() => setShowFeed(false)}
        initialTab={initialFeedTab}
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
          refresh
        }}
      />

      <Modal
        visible={showTransferInstructions}
        transparent
        animationType="slide"
      >
        <View style={tw`flex-1 justify-end bg-black/60 px-5 py-8`}>
          <View style={tw`rounded-[28px] bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <View style={tw`rounded-full bg-[#0FF1CF]/15 px-3 py-1.5`}>
                <Text
                  style={tw`text-[11px] font-semibold uppercase tracking-wider text-[#0FF1CF]`}
                >
                  ALAT transfer
                </Text>
              </View>
              <View
                style={tw`rounded-full border border-[#2A3E6A] px-3 py-1.5`}
              >
                <Text
                  style={tw`text-[11px] font-semibold uppercase tracking-wider text-white`}
                >
                  Awaiting payment
                </Text>
              </View>
            </View>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <Text style={tw`flex-1 text-xl font-bold text-white`}>
                Complete your transfer
              </Text>
              <SheetCloseButton
                accessibilityLabel="Close transfer instructions"
                onPress={() => setShowTransferInstructions(false)}
              />
            </View>

            <View style={tw`mt-4 gap-2 rounded-3xl bg-[#09173A] p-4`}>
              <View style={tw`flex-row items-start gap-3`}>
                <View
                  style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#0FF1CF]`}
                >
                  <Text style={tw`text-[11px] font-bold text-[#01082E]`}>
                    1
                  </Text>
                </View>
                <Text style={tw`flex-1 text-sm leading-5 text-white`}>
                  Transfer exactly{" "}
                  {formatCheckoutAmount(
                    transferInstructions?.amountInNaira || 0
                  )}{" "}
                  to the account below.
                </Text>
              </View>
              <View style={tw`flex-row items-start gap-3`}>
                <View
                  style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#0FF1CF]`}
                >
                  <Text style={tw`text-[11px] font-bold text-[#01082E]`}>
                    2
                  </Text>
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
                  {formatCheckoutAmount(
                    transferInstructions?.amountInNaira || 0
                  )}
                </Text>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>Bank</Text>
                <Text style={tw`mt-1 text-sm font-semibold text-white`}>
                  {transferInstructions?.bankName || "Wema Bank"}
                </Text>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>
                  Account name
                </Text>
                <Text style={tw`mt-1 text-sm font-semibold text-white`}>
                  {transferInstructions?.accountName ||
                    paymentOptions?.alatTransferDisplayName ||
                    "GatherGo"}
                </Text>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>
                  Account number
                </Text>
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
                    <Text
                      style={tw`text-xs font-semibold uppercase tracking-wide text-white`}
                    >
                      Copy number
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>
                  Expires in
                </Text>
                <Text style={tw`mt-1 text-lg font-bold text-[#FFD76A]`}>
                  {transferCountdownSeconds === null
                    ? "Bank transfer"
                    : transferCountdownSeconds === 0
                      ? "Hold expired"
                      : formatCountdown(transferCountdownSeconds)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowTransferInstructions(false);
                router.push(
                  `/transaction/${currentTransactionId}?type=${transactionType}`
                );
              }}
              style={tw`mt-5 rounded-full bg-[#0FF1CF] px-4 py-4`}
            >
              <Text
                style={tw`text-center text-sm font-semibold text-[#01082E]`}
              >
                I’ve made the transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <AppToast />
      </Modal>

      <Modal visible={showCreatorSetupModal} transparent animationType="fade">
        <View style={tw`flex-1 items-center justify-center bg-black/65 px-5`}>
          <View
            style={tw`w-full max-w-[420px] rounded-[28px] bg-[#041130] p-5`}
          >
            <Text style={tw`text-xl font-bold text-white`}>
              Finish payout setup
            </Text>
            <Text style={tw`mt-3 text-sm leading-6 text-[#B7C5E9]`}>
              {onboarding?.nextAction === "ADD_SETTLEMENT_ACCOUNT"
                ? "Your paid event is live. Add the settlement account next so we know where to pay your earnings."
                : onboarding?.nextAction === "COMPLETE_KYC"
                  ? "Your event can keep collecting payments, but payouts will stay on hold until identity verification is complete."
                  : "Your monetized event is ready. The next step is finishing the remaining wallet setup so all payout options are available."}
            </Text>

            <View style={tw`mt-5 rounded-2xl bg-[#0A173F] p-4`}>
              <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>
                Why this matters
              </Text>
              <Text style={tw`mt-2 text-sm leading-5 text-white`}>
                Buyers can keep paying now. This step is about unlocking
                settlement and making sure the payout account belongs to the
                right creator.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowCreatorSetupModal(false);
                router.push("/wallet");
              }}
              style={tw`mt-5 rounded-full bg-[#0FF1CF] px-4 py-4`}
            >
              <Text
                style={tw`text-center text-sm font-semibold text-[#01082E]`}
              >
                Complete in Wallet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCreatorSetupModal(false)}
              style={tw`mt-3 rounded-full border border-[#2A3E6A] px-4 py-4`}
            >
              <Text style={tw`text-center text-sm font-semibold text-white`}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <AppToast />
      </Modal>

      <Modal visible={showImpactReportModal} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/65 px-5 py-8`}>
          <View style={tw`max-h-[88%] rounded-[28px] bg-[#041130] p-5`}>
            <View style={tw`flex-row items-start justify-between gap-3`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xl font-bold text-white`}>
                  {impactReport ? "Edit impact report" : "Submit impact report"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowImpactReportModal(false)}
                style={tw`h-10 w-10 items-center justify-center rounded-full bg-[#0A173F]`}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={tw`mt-5`}
              contentContainerStyle={tw`pb-4`}
              keyboardShouldPersistTaps="handled"
            >
              <View style={tw`gap-2`}>
                <Text
                  style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                >
                  Summary
                </Text>
                <TextInput
                  autoCapitalize="none"
                  value={impactReportSummary}
                  onChangeText={setImpactReportSummary}
                  placeholder="What happened, who benefited, and what changed?"
                  placeholderTextColor="#8FA1CB"
                  multiline
                  maxLength={1000}
                  style={tw`min-h-[110px] rounded-2xl bg-[#101C45] p-4 text-white`}
                />
              </View>

              <View style={tw`mt-5 gap-3`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <Text
                    style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                  >
                    Outcomes
                  </Text>
                  <TouchableOpacity
                    onPress={addImpactReportOutcome}
                    style={tw`rounded-full bg-[#0FF1CF]/15 px-3 py-2`}
                  >
                    <Text style={tw`text-xs font-bold text-[#0FF1CF]`}>
                      Add outcome
                    </Text>
                  </TouchableOpacity>
                </View>

                {impactReportOutcomes.map((outcome, index) => (
                  <View
                    key={outcome.id || index}
                    style={tw`rounded-2xl bg-[#08143B] p-4`}
                  >
                    <View style={tw`flex-row items-center justify-between`}>
                      <Text style={tw`text-sm font-semibold text-white`}>
                        Outcome {index + 1}
                      </Text>
                      {impactReportOutcomes.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeImpactReportOutcome(index)}
                        >
                          <Text
                            style={tw`text-xs font-semibold text-[#FF8A8A]`}
                          >
                            Remove
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TextInput
                      autoCapitalize="none"
                      value={outcome.label}
                      onChangeText={(value) =>
                        updateImpactReportOutcome(index, { label: value })
                      }
                      placeholder="Label, e.g. Trees planted"
                      placeholderTextColor="#8FA1CB"
                      style={tw`mt-3 rounded-2xl bg-[#101C45] px-4 py-3 text-white`}
                    />

                    <View style={tw`mt-3 flex-row gap-3`}>
                      <TextInput
                        value={outcome.value}
                        onChangeText={(value) =>
                          updateImpactReportOutcome(index, { value })
                        }
                        placeholder="Value"
                        placeholderTextColor="#8FA1CB"
                        keyboardType="numeric"
                        style={tw`flex-1 rounded-2xl bg-[#101C45] px-4 py-3 text-white`}
                      />
                      <TextInput
                        autoCapitalize="none"
                        value={outcome.unit}
                        onChangeText={(value) =>
                          updateImpactReportOutcome(index, { unit: value })
                        }
                        placeholder="Unit"
                        placeholderTextColor="#8FA1CB"
                        style={tw`flex-1 rounded-2xl bg-[#101C45] px-4 py-3 text-white`}
                      />
                    </View>

                    <TextInput
                      autoCapitalize="none"
                      value={outcome.note}
                      onChangeText={(value) =>
                        updateImpactReportOutcome(index, { note: value })
                      }
                      placeholder="Optional note"
                      placeholderTextColor="#8FA1CB"
                      multiline
                      style={tw`mt-3 min-h-[72px] rounded-2xl bg-[#101C45] px-4 py-3 text-white`}
                    />
                  </View>
                ))}
              </View>

              <View style={tw`mt-5 gap-2`}>
                <Text
                  style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}
                >
                  Evidence links
                </Text>
                <TextInput
                  autoCapitalize="none"
                  value={impactReportEvidenceText}
                  onChangeText={setImpactReportEvidenceText}
                  placeholder="Paste up to 5 links, one per line"
                  placeholderTextColor="#8FA1CB"
                  multiline
                  style={tw`min-h-[92px] rounded-2xl bg-[#101C45] p-4 text-white`}
                />
              </View>

              <View style={tw`mt-6 gap-3`}>
                <CustomButton
                  onPress={submitImpactReport}
                  disabled={submittingImpactReport}
                  buttonClassName="bg-[#0FF1CF] border-0 w-full"
                  textClassName="!text-black"
                  arrowCircleColor="bg-[#0C7F7F]"
                  title={
                    submittingImpactReport ? "Publishing" : "Publish report"
                  }
                />
                <TouchableOpacity
                  onPress={() => setShowImpactReportModal(false)}
                  style={tw`rounded-xl border border-[#2A3E6A] px-4 py-4`}
                >
                  <Text
                    style={tw`text-center text-sm font-semibold text-white`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
        <AppToast />
      </Modal>

      <PaystackWebViewWrapper
        visible={showPaystackWebView}
        onClose={() => {
          setShowPaystackWebView(false);
          closePaymentSelectionSurfaces();
        }}
        paymentUrl={paystackPaymentUrl}
        checkoutDeadlineMs={checkoutDeadlineMs}
        type={transactionType}
        onSuccess={(reference) => {
          console.log("✅ Payment successful, reference:", reference);
          showGlobalSuccess("Confirming your payment…");
          closePaymentSelectionSurfaces();
          setShowPaystackWebView(false);
          router.replace(
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
