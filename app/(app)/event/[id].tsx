import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import type { ThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCheckoutCountdown } from "@/hooks/useCheckoutCountdown";
import { useFreeEventRegistration } from "@/hooks/useFreeEventRegistration";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  cancelCheckout,
  cancelEventCheckout,
  recordEventInterest,
} from "@/services/serviceFn";
import { getApiErrorMessage } from "@/utils/apiError";
import { checkoutIntentKey } from "@/utils/checkout";
import { getFeedFrenzyLevel } from "@/utils/feedFrenzy";
import { isAxiosError } from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
// EventPage.tsx
import AvatarWithLabel from "@/components/AvatarWithLabel";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { EventImageWithProcessing } from "@/components/EventImageWithProcessing";
import { PaystackWebViewWrapper } from "@/components/PaystackWebViewWrapper";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import PricingCard from "@/components/eventInfo/TicketCard";
import FlameFeedButton from "@/components/feed/FlameFeedButton";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import AppToast from "@/components/ui/AppToast";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import InfoDisclosure from "@/components/ui/InfoDisclosure";
import { SdgGoalIcon } from "@/components/ui/SdgGoalIcon";
import WalletSetupReminder from "@/components/ui/WalletSetupReminder";
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
  usePublishEventTicket,
  useRegisterEvent,
  useUpsertEventImpactReport,
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
  UpsertEventImpactReportPayload,
} from "@/types/event";
import {
  formatEventDateTime,
  isEventEditableBeforeStartDay,
  isEventPastEnd,
} from "@/utils/dateTimeHandler";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import EventShareSheet from '@/components/eventInfo/EventShareSheet';
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
import { useLocalSearchParams } from "expo-router";
import { Edit2Icon, Share2Icon } from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import EventVolunteering from "@/components/volunteer/EventVolunteering";
import VolunteerButton from "@/components/volunteer/VolunteerButton";
import VolunteerRolesSheet from "@/components/volunteer/VolunteerRolesSheet";
import DontationProgress from "./DontationProgress";
import FeedBottomSheet from "./FeedBottomSheet";

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
  note: "",
});

const EVENT_TONES: Record<string, EventTone> = {
  volunteer: {
    label: "Volunteering",
    accent: "#0FF1CF",
    iconName: "people-outline",
  },
  ticket: {
    label: "Ticketed",
    accent: "#0FF1CF",
    iconName: "ticket-outline",
  },
  registration: {
    label: "Registration",
    accent: "#F8D05C",
    iconName: "create-outline",
  },
  foodbank: { label: "Food bank", accent: "#0FF1CF", iconName: "restaurant-outline" },
  donation: {
    label: "Donation",
    accent: "#FF6B6B",
    iconName: "heart-outline",
  },
};

const DEFAULT_EVENT_TONE: EventTone = {
  label: "GatherGo",
  accent: "#31C6F6",
  iconName: "radio-outline",
};

const getEventTone = (
  registrationType: string | null | undefined,
  color: ThemeColor
) => {
  const tone = registrationType
    ? EVENT_TONES[registrationType] || DEFAULT_EVENT_TONE
    : DEFAULT_EVENT_TONE;
  return {
    ...tone,
    accent: color(
      tone.accent,
      registrationType === "donation"
        ? "danger"
        : registrationType === "registration"
        ? "warning"
        : "accent"
    ),
  };
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
    year: "numeric",
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
  donationTarget,
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

  if (registrationType === "foodbank") return "Timed meal collection";

  if (registrationType === "donation") {
    const target = Number(donationTarget || 0);
    return target > 0
      ? `Target ${numberWithCommas(target / 100, true, null)}`
      : "Open donation";
  }

  if (registrationType === "volunteer")
    return "Volunteer places · no ticket required";

  return "Open invite";
};

const EventHeroChip = ({
  iconName,
  label,
  accent = "#0FF1CF",
}: {
  iconName: IoniconName;
  label: string;
  accent?: string;
}) => {
  const { tw } = useAppTheme();
  return (
    <View
      style={[
        tw`max-w-full flex-row items-center rounded-full border px-3 py-2`,
        { backgroundColor: `${accent}18`, borderColor: `${accent}33` },
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
};

const EventDetailRow = ({
  iconName,
  title,
  subtitle,
  accent = "#0FF1CF",
}: {
  iconName: IoniconName;
  title: string;
  subtitle: string;
  accent?: string;
}) => {
  const { tw } = useAppTheme();
  return (
    <View style={tw`flex-row items-start gap-3`}>
      <Ionicons name={iconName} size={18} color={accent} style={tw`mt-0.5`} />
      <View style={tw`flex-1 min-w-0`}>
        <Text style={tw`text-xs text-muted dark:text-[#87A0D6]`}>{title}</Text>
        <Text
          style={tw`mt-0.5 text-sm font-medium leading-5 text-foreground dark:text-white`}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
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
    chargeAmountNaira: chargeAmountKobo / 100,
  };
};

const EventPage = () => {
  const { tw, color } = useAppTheme();
  const layout = useResponsiveLayout({ hasTabNavigation: false });
  const detailsInColumns = layout.detailColumns === 2;
  const sheetMargin = Math.max(0, (layout.availableWidth - 680) / 2);
  const sheetContainerStyle = {
    marginLeft: layout.insets.left + sheetMargin,
    marginRight: layout.insets.right + sheetMargin,
  };
  const queryClient = useQueryClient();
  const { id, openFeed, feedTab, donate, donationSource } = useLocalSearchParams<{
    id?: string | string[];
    openFeed?: string | string[];
    feedTab?: string | string[];
    donate?: string;
    donationSource?: string;
  }>(); // eventId
  const { user } = useAuth();

  const eventId = Array.isArray(id) ? id[0] : id;
  const resolvedEventId = eventId || "";
  const rawFeedTab = Array.isArray(feedTab) ? feedTab[0] : feedTab;
  const initialFeedTab = rawFeedTab === "carpool" ? "carpool" : "feed";
  const shouldOpenFeedFromRoute =
    (Array.isArray(openFeed) ? openFeed[0] : openFeed) === "1";
  const router = useLockedRouter();

  const [selectedTickets, setSelectedTickets] = useState<GetTickets[]>([]);
  const [shareVisible, setShareVisible] = useState(false);
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

  const [updatingCheckout, setUpdatingCheckout] = useState(false);
  const checkoutSubmittingRef = useRef(false);
  const [cancellingCheckout, setCancellingCheckout] = useState(false);
  const cancellingCheckoutRef = useRef(false);
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
    refreshing: feedRefreshing,
    error,
    hideFeed,
    refresh,
    markAllAsSeen,
    setFeedVisibility,
    getFeedStats, // Get stats for animation
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
    if (
      !paymentOptions ||
      checkoutSubmittingRef.current ||
      cancellingCheckoutRef.current
    )
      return;
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

  const clearPaymentState = useCallback(() => {
    setShowPaystackWebView(false);
    setShowTransferInstructions(false);
    setCheckoutDeadlineMs(null);
    setCurrentTransactionId("");
    setPaystackPaymentUrl("");
    setTransferInstructions(null);
  }, []);

  const openCheckoutStatus = useCallback(
    (transactionId: string, type: typeof transactionType) => {
      closePaymentSelectionSurfaces();
      clearPaymentState();
      router.push(`/transaction/${transactionId}?type=${type}`);
    },
    [clearPaymentState, closePaymentSelectionSurfaces, router]
  );

  const handlePaymentCancel = useCallback(async () => {
    if (cancellingCheckoutRef.current) return;
    closePaymentSelectionSurfaces();
    clearPaymentState();
    if (transactionType === "DONATION") {
      showGlobalWarning("Payment cancelled");
      return;
    }
    if (!user) return;
    cancellingCheckoutRef.current = true;
    setCancellingCheckout(true);
    try {
      await cancelEventCheckout(currentTransactionId, user.id, resolvedEventId);
      showGlobalWarning("Checkout cancelled. You can try again.");
    } catch {
      showGlobalError(
        "Could not cancel checkout. Check its payment status before trying again."
      );
      openCheckoutStatus(currentTransactionId, transactionType);
    } finally {
      cancellingCheckoutRef.current = false;
      setCancellingCheckout(false);
    }
  }, [
    clearPaymentState,
    closePaymentSelectionSurfaces,
    currentTransactionId,
    openCheckoutStatus,
    resolvedEventId,
    transactionType,
    user,
  ]);

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
  const recordedInterestEvent = useRef<string | null>(null);
  useEffect(() => {
    if (!data || isOwner || recordedInterestEvent.current === resolvedEventId)
      return;
    recordedInterestEvent.current = resolvedEventId;
    void recordEventInterest({ eventId: resolvedEventId, kind: "VIEW" }).catch(
      () => console.warn("Gogo could not update event activity.")
    );
  }, [data, isOwner, resolvedEventId]);
  const {
    mutate: publishTicket,
    isPending: publishingTicket,
    variables: publishingTicketId,
  } = usePublishEventTicket(resolvedEventId, {
    onSuccess: () => showGlobalSuccess("Ticket published"),
    onError: () =>
      showGlobalError("Couldn’t publish the ticket. Please try again."),
  });
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

  useEffect(() => {
    if (donate === '1' && data) {
      router.setParams({ donate: undefined });
      if (data.data.donationsEnabled) openDonationSheet();
    }
  }, [donate, data, openDonationSheet, router]);

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
    if (transferCountdownSeconds !== 0 || !currentTransactionId) return;
    openCheckoutStatus(currentTransactionId, transactionType);
  }, [
    transferCountdownSeconds,
    currentTransactionId,
    openCheckoutStatus,
    transactionType,
  ]);

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
      if (
        !paymentOptions ||
        paymentOptions.availableProviders.length === 0 ||
        baseAmountNaira <= 0
      ) {
        return null;
      }

      const providerPreviews = paymentOptions.availableProviders.map(
        (provider) => ({
          provider,
          preview: buildCheckoutPreview(
            baseAmountNaira,
            provider,
            paymentOptions.pricingConfig
          ),
        })
      );
      const selectedPreview = buildCheckoutPreview(
        baseAmountNaira,
        selectedProvider,
        paymentOptions.pricingConfig
      );
      const accentBg =
        accent === "red"
          ? "bg-danger dark:bg-[#FF6B6B]"
          : "bg-accentFill dark:bg-[#0FF1CF]";
      const accentText =
        accent === "red"
          ? "text-danger dark:text-[#FF9D9D]"
          : "text-accent dark:text-[#0FF1CF]";

      return (
        <View style={tw`rounded-2xl bg-surface dark:bg-[#101C45] p-3`}>
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <Text
              style={tw`flex-1 text-sm font-semibold text-foreground dark:text-white`}
            >
              {title}
            </Text>
            <Text style={tw.style("text-sm font-bold", accentText)}>
              {formatCheckoutAmount(selectedPreview.chargeAmountNaira)}
            </Text>
          </View>
          <Text
            style={tw`mt-1 text-xs leading-5 text-muted dark:text-gray-400`}
          >
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
                      : "border-border dark:border-[#2A3E6A] bg-surface dark:bg-[#08143B]"
                  )}
                >
                  <Text
                    style={tw.style(
                      "text-xs font-semibold uppercase tracking-wide",
                      selected
                        ? "text-onAccent dark:text-[#01082E]"
                        : "text-muted dark:text-gray-400"
                    )}
                  >
                    {PROVIDER_LABELS[provider]}
                  </Text>
                  <Text
                    style={tw.style(
                      "mt-1 text-sm font-bold",
                      selected
                        ? "text-onAccent dark:text-[#01082E]"
                        : "text-foreground dark:text-white"
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
    [paymentOptions, selectedProvider, tw]
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

      handleProviderInitSuccess(response, "TICKET");
    },
  });

  const { mutateAsync: registerEvent, isPending: registeringEvent } =
    useRegisterEvent({
      onSuccess: (response) => {
        showGlobalSuccess("Checkout started successfully.");
        handleProviderInitSuccess(response, "REGISTRATION");
      },
    });

  const registrationDisabled =
    registeringEvent ||
    updatingCheckout ||
    cancellingCheckout ||
    checkingRegistration ||
    hasFreeRegistration;

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

  const { mutateAsync: upsertImpactReport, isPending: submittingImpactReport } =
    useUpsertEventImpactReport(resolvedEventId, {
      onSuccess: () => {
        setShowImpactReportModal(false);
        showGlobalSuccess("Impact report published.");
      },
      onError: (error) => {
        console.error("Impact report submission failed:", error);
        showGlobalError("Failed to publish impact report");
      },
    });

  const handleTransaction = useCallback(
    async (isRegistration?: boolean) => {
      if (cancellingCheckoutRef.current || checkoutSubmittingRef.current)
        return;
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
              .map(({ id, quantity }) => ({ id, quantity })),
          });
      checkoutSubmittingRef.current = true;
      clearPaymentState();
      try {
        const idempotencyKey = await checkoutIntentKey(
          user.id,
          resolvedEventId,
          intent
        );
        const submitCheckout = async () => {
          if (isRegistration) {
            await registerEvent({
              idempotencyKey,
              eventId: resolvedEventId,
              provider: selectedProvider,
              platform: "mobile",
            });
            return;
          }
          await mutateAsync({
            idempotencyKey,
            items: selectedTickets,
            provider: selectedProvider,
            clientContext: { platform: "mobile" },
          });
        };

        try {
          await submitCheckout();
        } catch (error) {
          const activeCheckoutId =
            isAxiosError<{ transactionId?: string }>(error) &&
            error.response?.status === 409
              ? error.response.data.transactionId
              : undefined;
          if (!activeCheckoutId) throw error;
          if (isRegistration) {
            showGlobalWarning(
              "You have an unfinished checkout. Resume or cancel it here."
            );
            openCheckoutStatus(activeCheckoutId, "REGISTRATION");
            return;
          }

          setUpdatingCheckout(true);
          try {
            // This revised order already has a persisted key. Keep it for the retry.
            await cancelCheckout(activeCheckoutId);
          } catch {
            showGlobalError(
              "Could not update checkout. Check the previous payment before trying again."
            );
            openCheckoutStatus(activeCheckoutId, "TICKET");
            return;
          }
          // Replace once per press; a further conflict or network error stays visible.
          await submitCheckout();
        }
      } catch (error) {
        showGlobalError(
          getApiErrorMessage(
            error,
            "Could not start checkout. Retry to resume your request."
          )
        );
      } finally {
        checkoutSubmittingRef.current = false;
        setUpdatingCheckout(false);
      }
    },
    [
      clearPaymentState,
      closeEndedPaymentFlow,
      hasEventEnded,
      mutateAsync,
      openCheckoutStatus,
      registerEvent,
      registrationDisabled,
      registrationCheckFailed,
      refreshRegistration,
      resolvedEventId,
      selectedProvider,
      selectedTickets,
      user,
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
    registrationFeeAmount,
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
        ...(donationSource === "FOOD_BANK" && data?.data.registrationType === "foodbank" ? { source: "FOOD_BANK" as const } : {}),
        isAnonymous,
        provider: selectedProvider,
        clientContext: {
          platform: "mobile",
        },
      });
    } catch (error) {
      console.error("Donation error:", error);
    }
  };

  const handleShare = useCallback(() => setShareVisible(true), []);

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
          params: { eventId: resolvedEventId, autoOpenEventPicker: "1" },
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

  if (isPending) {
    return (
      <View
        style={[
          tw`flex-1 bg-background dark:bg-[#01082E]`,
          { paddingTop: spacing.xxl },
        ]}
      >
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
      <View
        style={tw`flex-1 bg-background dark:bg-[#01082E] items-center justify-center px-5`}
      >
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={color("#FF5555", "danger")}
        />
        <Text style={tw`text-foreground dark:text-white text-xl mt-4`}>
          {isNotFound ? resolvedEventId : "Something went wrong"}
        </Text>
        <CustomButton
          title="Go Back"
          onPress={() => router.replace("/")}
          buttonClassName="bg-accentFill dark:bg-[#0FF1CF] mt-6 w-full max-w-[300px]"
          textClassName="!text-onAccent dark:text-black"
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
    registrationType,
  } = data?.data;

  const publishedTickets = eventTickets.filter((ticket) => ticket.isVisible);
  const ticketsToShow = owner ? eventTickets : publishedTickets;
  const eventDateTime = formatEventDateTime(startDate, endDate);
  const impactSummary = impactTitle?.trim() || null;
  const impactNote = impactDescription?.trim() || "";
  const persistedImpactMap = normalizePersistedImpactMap({
    impactSdgGoals,
    impactPaths,
    impactCommitments,
  });
  const selectedSdgGoals = persistedImpactMap.sdgGoals;
  const selectedImpactPaths = persistedImpactMap.impactPaths;
  const selectedCommitments = persistedImpactMap.commitments;
  const eventLinks = links || [];
  const eventTone = getEventTone(registrationType, color);
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
    donationTarget: data.data.donationTarget,
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
            note: outcome.note || "",
          }))
        : selectedCommitments.length
        ? selectedCommitments.map((commitment) => ({
            id: commitment.id,
            type: commitment.type,
            label: commitment.label,
            value: String(commitment.value),
            unit: commitment.unit,
            note: "",
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
      createEmptyImpactOutcome(),
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
            ...(note ? { note } : {}),
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
        evidenceLinks: parseEvidenceLinks(impactReportEvidenceText),
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

  const organizerCard = (
    <View style={tw`py-3`}>
      <View
        style={tw`px-4 w-full flex-row flex-wrap gap-3 justify-between items-center`}
      >
        <AvatarWithLabel
          imageUrl={creator.profilePicUrlTN}
          username={creator.username}
          role="Organizer"
        />
        {!owner && (
          <TouchableOpacity
            style={tw`p-3 rounded-lg bg-surface dark:bg-[#0c1447]`}
            onPress={onFollow}
          >
            <Text style={tw`text-foreground dark:text-white`}>
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
                  params: { id: resolvedEventId },
                })
              }
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit event"
              style={[
                tw`p-3 rounded-lg`,
                !canEditEvent ? tw`opacity-40` : null,
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
              <Edit2Icon color={color("#0FF1CF", "accent")} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
  const participationActions = (
    <View style={tw`px-4 py-3 w-full gap-3`}>
      {hasEventEnded && registrationType !== "foodbank" ? (
        <CustomButton
          disabled
          onPress={() => {}}
          showArrow={false}
          buttonClassName="bg-surfaceMuted dark:bg-[#1B2A50] border border-border dark:border-[#2B3C66] w-full"
          textClassName="!text-muted dark:text-[#8FA1CB]"
          title="Event ended"
        />
      ) : registrationType === "foodbank" ? (
        <View style={tw`gap-3`}>
          <CustomButton title={owner ? "Manage collection" : "Collect a meal"} onPress={() => router.push(`/food-bank/${resolvedEventId}`)} showArrow={false} />
          {!hasEventEnded ? (
            <CustomButton title="Support with a donation" onPress={openDonationSheet} showArrow={false} />
          ) : null}
          <InfoDisclosure
            label="Collection info"
            message="One meal pass per person, while collection windows are available. Donations are optional and support the food bank; additional donations do not issue another pass."
          />
        </View>
      ) : registrationType === "ticket" ? (
        <CustomButton
          onPress={openSheet}
          showArrow={false}
          buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-onAccent dark:text-black shrink"
          title="View tickets"
        />
      ) : registrationType === "registration" ? (
        <CustomButton
          onPress={handleRegisterPress}
          disabled={registrationDisabled}
          showArrow={false}
          buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-onAccent dark:text-black shrink"
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
          buttonClassName="bg-danger dark:bg-[#FF6B6B] border-0 w-full"
          textClassName="!text-onPrimary dark:text-white shrink"
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
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={tw`flex-1 bg-background dark:bg-[#01082E] items-center w-full`}
    >
      <View style={{ flex: 1, width: "100%", maxWidth: layout.pageWidth }}>
        <CustomView className="max-w-full" style={tw`px-3`}>
          <CustomeTopBarNav
            title="Event Details"
            onClickBack={() => safeGoBack(router, "/")}
          />
        </CustomView>

        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: detailsInColumns ? undefined : 760,
            alignSelf: "center",
            flexDirection: detailsInColumns ? "row" : "column",
            gap: detailsInColumns ? 24 : 0,
          }}
        >
          <ScrollView
            style={{ flex: 1, minWidth: 0, width: "100%" }}
            contentContainerStyle={tw`pb-4`}
            showsVerticalScrollIndicator={false}
          >
            <View style={tw`px-4 pt-2`}>
              <View
                style={[
                  tw`overflow-hidden rounded-[32px] border bg-surface dark:bg-[#07143B]`,
                  { borderColor: `${eventTone.accent}33` },
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
                    style={tw`absolute bottom-0 left-0 right-0 bg-background/82 dark:bg-[#01082E]/82 px-5 pb-5 pt-8`}
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
                        style={tw`flex-1 text-2xl font-bold leading-8 text-foreground dark:text-white`}
                        numberOfLines={3}
                      >
                        {title}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.84}
                        accessibilityRole="button"
                        accessibilityLabel="Share event"
                        onPress={handleShare}
                        style={tw`h-12 w-12 items-center justify-center rounded-full bg-accentFill dark:bg-[#0FF1CF] border border-borderStrong/15 dark:border-white/15`}
                      >
                        <Share2Icon
                          color={color("#01082E", "onAccent")}
                          size={19}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={tw`gap-4 p-5`}>
                  {(data.data.donationsEnabled ||
                    data.data.totalDonations > 0) && (
                    <DontationProgress
                      donationTarget={data.data.donationTarget}
                      totalDonations={data.data.totalDonations}
                    />
                  )}
                  {data.data.donationsEnabled &&
                  registrationType === "volunteer" &&
                  !hasEventEnded ? (
                    <CustomButton
                      showArrow={false}
                      title="Support with a donation"
                      onPress={openDonationSheet}
                      buttonClassName="w-full border-danger dark:border-[#FF6B6B]"
                      textClassName="text-danger dark:text-[#FF9D9D]"
                    />
                  ) : null}

                  <View style={tw`gap-3`}>
                    <EventDetailRow
                      iconName="calendar-outline"
                      title="When"
                      subtitle={eventDateTime}
                      accent="#0FF1CF"
                    />
                    <EventDetailRow
                      iconName={eventTone.iconName}
                      title={
                        data.data.registrationType === "donation"
                          ? "Target"
                          : "Access"
                      }
                      subtitle={participationSummary}
                      accent={eventTone.accent}
                    />
                    <EventDetailRow
                      iconName={
                        isPhysicalEvent === false
                          ? "desktop-outline"
                          : "map-outline"
                      }
                      title="Where"
                      subtitle={locationLabel}
                      accent="#31C6F6"
                    />
                  </View>
                </View>
              </View>
            </View>

            {registrationType === "volunteer" && (
              <View style={tw`px-5 pt-4`}>
                <EventVolunteering
                  event={data.data}
                  owner={owner}
                  onPress={() => setShowVolunteerRoles(true)}
                />
              </View>
            )}

            {hasEventEnded && (
              <CustomView className="max-w-full" style={tw`px-4 pt-4`}>
                <View
                  style={tw`rounded-[24px] border border-border dark:border-[#24345A] bg-surface dark:bg-[#0A173F] p-4`}
                >
                  <Text
                    style={tw`text-sm font-semibold text-warning dark:text-[#F1D417]`}
                  >
                    This event has ended
                  </Text>
                  <Text
                    style={tw`mt-2 text-sm leading-5 text-secondary dark:text-[#C6D5F2]`}
                  >
                    You can still review the event details, updates, organizer
                    profile, and related links here.
                  </Text>
                </View>
              </CustomView>
            )}

            <CustomView className="max-w-full" style={tw`px-5 pt-4`}>
              <Text
                style={tw`text-xl font-semibold text-foreground dark:text-white`}
              >
                About this event
              </Text>
              <Text
                style={tw`mt-3 text-sm leading-6 text-foreground dark:text-[#DDE6FF]`}
              >
                {description}
              </Text>
            </CustomView>

            {(impactSummary ||
              impactNote ||
              selectedSdgGoals.length > 0 ||
              selectedImpactPaths.length > 0 ||
              selectedCommitments.length > 0) && (
              <CustomView className="max-w-full" style={tw`px-4 pt-4`}>
                <View
                  style={tw`rounded-[28px] border border-border dark:border-[#1B2A50] bg-surface dark:bg-[#101C45] p-5`}
                >
                  <View style={tw`flex-row items-start justify-between gap-3`}>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}
                      >
                        Impact story
                      </Text>
                      <Text
                        style={tw`mt-2 text-xl font-semibold text-foreground dark:text-white`}
                      >
                        {impactSummary || "From the organiser"}
                      </Text>
                      <Text
                        style={tw`mt-3 text-sm leading-6 text-foreground dark:text-[#DDE6FF]`}
                      >
                        {impactNote}
                      </Text>
                    </View>
                    {selectedSdgGoals[0] ? (
                      <View
                        style={[
                          tw`h-11 w-11 items-center justify-center rounded-full`,
                          { backgroundColor: selectedSdgGoals[0].color },
                        ]}
                      >
                        <SdgGoalIcon
                          number={selectedSdgGoals[0].number}
                          color={color("white", "foreground")}
                          size={23}
                        />
                      </View>
                    ) : (
                      <View
                        style={tw`rounded-full bg-accentFill dark:bg-[#0FF1CF] px-3 py-2`}
                      >
                        <Text
                          style={tw`text-sm font-bold text-onAccent dark:text-[#01082E]`}
                        >
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
                          style={tw`flex-row items-center rounded-full bg-surface dark:bg-[#0A173F] pr-3`}
                        >
                          <View
                            style={[
                              tw`h-7 w-7 items-center justify-center rounded-full`,
                              { backgroundColor: goal.color },
                            ]}
                          >
                            <SdgGoalIcon
                              number={goal.number}
                              color={color("white", "foreground")}
                              size={14}
                            />
                          </View>
                          <Text
                            style={tw`ml-2 text-xs font-semibold text-foreground dark:text-white`}
                          >
                            {goal.shortTitle}
                          </Text>
                        </View>
                      ))}

                      {selectedCommitments.map((commitment) => (
                        <View
                          key={commitment.id}
                          style={tw`rounded-full bg-warningFill/10 dark:bg-[#F4B942]/10 px-3 py-2`}
                        >
                          <Text
                            style={tw`text-xs font-semibold text-warning dark:text-[#FFE5A0]`}
                          >
                            {commitment.label}
                          </Text>
                        </View>
                      ))}

                      {selectedImpactPaths.map((mechanism) => (
                        <View
                          key={mechanism.id}
                          style={tw`rounded-full bg-accentFill/10 dark:bg-[#0FF1CF]/10 px-3 py-2`}
                        >
                          <Text
                            style={tw`text-xs font-semibold text-foreground dark:text-[#B7FFF5]`}
                          >
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
              <CustomView className="max-w-full" style={tw`px-5 pb-4`}>
                <View
                  style={tw`rounded-3xl border border-border dark:border-[#1D3B64] bg-surface dark:bg-[#08143B] p-4`}
                >
                  <View style={tw`flex-row items-start justify-between gap-3`}>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}
                      >
                        Reported impact
                      </Text>
                      {impactReportPublishedDate && (
                        <Text
                          style={tw`mt-1 text-xs text-muted dark:text-[#8FA1CB]`}
                        >
                          Published {impactReportPublishedDate}
                        </Text>
                      )}
                    </View>

                    {owner && (
                      <TouchableOpacity
                        onPress={openImpactReportModal}
                        style={tw`rounded-full bg-accentFill dark:bg-[#0FF1CF] px-3 py-2`}
                      >
                        <Text
                          style={tw`text-xs font-bold text-onAccent dark:text-[#01082E]`}
                        >
                          {impactReport ? "Edit" : "Submit"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {impactReport ? (
                    <>
                      <Text
                        style={tw`mt-4 text-sm leading-6 text-foreground dark:text-white`}
                      >
                        {impactReport.summary}
                      </Text>

                      {reportedOutcomes.length > 0 && (
                        <View style={tw`mt-4 flex-row flex-wrap gap-3`}>
                          {reportedOutcomes.map((outcome, index) => (
                            <View
                              key={outcome.id || `${outcome.type}-${index}`}
                              style={tw`min-w-[130px] flex-1 rounded-2xl bg-surface dark:bg-[#101C45] p-3`}
                            >
                              <Text
                                style={tw`text-xl font-bold text-accent dark:text-[#0FF1CF]`}
                              >
                                {numberWithCommas(outcome.value, false, null)}
                              </Text>
                              <Text
                                style={tw`mt-1 text-xs uppercase text-muted dark:text-[#8FA1CB]`}
                              >
                                {outcome.unit}
                              </Text>
                              <Text
                                style={tw`mt-2 text-sm font-semibold text-foreground dark:text-white`}
                              >
                                {outcome.label}
                              </Text>
                              {outcome.note ? (
                                <Text
                                  style={tw`mt-1 text-xs leading-5 text-secondary dark:text-[#B7C5E9]`}
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
                            style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}
                          >
                            Evidence
                          </Text>
                          {reportedEvidenceLinks.map((link, index) => (
                            <TouchableOpacity
                              key={`${link}-${index}`}
                              onPress={() => handleOpenEventLink(link)}
                              style={tw`rounded-2xl bg-surface dark:bg-[#0A173F] px-4 py-3`}
                            >
                              <Text
                                style={tw`text-sm font-semibold text-accent dark:text-[#0FF1CF]`}
                              >
                                {link}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <Text
                      style={tw`mt-4 text-sm leading-6 text-secondary dark:text-[#C6D5F2]`}
                    >
                      Share what actually happened after this event: outcomes,
                      numbers, and links people can trust.
                    </Text>
                  )}
                </View>
              </CustomView>
            )}
            {eventLinks.length > 0 && (
              <CustomView className="max-w-full" style={tw`px-4 pt-4`}>
                <View
                  style={tw`rounded-[28px] border border-border dark:border-[#1B2A50] bg-surface dark:bg-[#101C45] p-5`}
                >
                  <Text
                    style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}
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
                          style={tw`rounded-2xl border border-border dark:border-[#1B2A50] bg-surface dark:bg-[#0A173F] px-4 py-4`}
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
                              <Text
                                style={tw`text-base font-semibold text-foreground dark:text-white`}
                              >
                                {linkMeta.label}
                              </Text>
                              <Text
                                style={tw`mt-1 text-xs text-muted dark:text-[#8FA1CB]`}
                              >
                                {linkMeta.host || linkMeta.subtitle}
                              </Text>
                            </View>

                            <Ionicons
                              name="open-outline"
                              size={18}
                              color={color("#0FF1CF", "accent")}
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
              (paymentOptions?.requiresPayment ||
                paymentOptions?.acceptsDonations) && (
                <CustomView className="max-w-full" style={tw`px-4 pt-4`}>
                  <WalletSetupReminder
                    nextAction={onboarding.nextAction}
                    onPress={() => router.push("/wallet")}
                  />
                </CustomView>
              )}
            {!detailsInColumns ? organizerCard : null}
          </ScrollView>
          {detailsInColumns ? (
            <ScrollView
              style={{ width: 336, flexGrow: 0, flexShrink: 0 }}
              contentContainerStyle={tw`pb-4`}
              showsVerticalScrollIndicator={false}
            >
              {organizerCard}
              {participationActions}
            </ScrollView>
          ) : (
            participationActions
          )}
        </View>
      </View>

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
        containerStyle={sheetContainerStyle}
        topInset={layout.insets.top}
        bottomInset={layout.insets.bottom}
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
        backgroundStyle={{ backgroundColor: color("#01082E", "background") }}
      >
        <View style={tw`flex-row justify-between items-center p-5`}>
          <Text style={tw`text-foreground dark:text-white`}>
            {!owner && publishedTickets.length > 0 ? "BUY TICKET" : "Tickets"}
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
            ticketsToShow.length === 0
              ? tw`grow justify-center pb-10`
              : undefined
          }
        >
          {ticketsToShow.length === 0 ? (
            <MascotMoment
              variant="empty"
              layout="stacked"
              title="Tickets aren't live yet"
              message="The organiser hasn't published tickets for this event. Check back here soon."
              typing={false}
            />
          ) : (
            <View style={tw`py-5 gap-5`}>
              {ticketsToShow.map((ticket) => (
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
                      0
                    ) < paymentOptions.maxTicketsPerCheckout
                  }
                  onQuantityChange={
                    ticket.isVisible
                      ? (change) =>
                          handleTicketSelection(ticket.id, ticket.type, change)
                      : undefined
                  }
                  onPublish={
                    owner && !ticket.isVisible && !hasEventEnded
                      ? () => {
                          if (!publishingTicket) publishTicket(ticket.id);
                        }
                      : undefined
                  }
                  isPublishing={
                    publishingTicket && publishingTicketId === ticket.id
                  }
                  publishDisabled={publishingTicket}
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
          <View style={tw`w-full max-w-[640px] self-center gap-3 p-5`}>
            {renderProviderSelector(ticketTotal)}
            <CustomButton
              onPress={() => handleTransaction(false)}
              disabled={
                hasEventEnded ||
                selectedTickets.length === 0 ||
                gettingTickets ||
                updatingCheckout ||
                cancellingCheckout
              }
              title={
                hasEventEnded
                  ? "Event ended"
                  : updatingCheckout
                  ? "Updating checkout..."
                  : cancellingCheckout
                  ? "Cancelling checkout..."
                  : gettingTickets
                  ? "Initiating..."
                  : ticketTotal > 0
                  ? `Pay ${formatCheckoutAmount(
                      ticketPreview.chargeAmountNaira
                    )}`
                  : "Claim tickets"
              }
              buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full border-0"
              textClassName="!text-onAccent dark:text-black"
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
          <View style={tw`rounded-[28px] bg-background dark:bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <View>
                <Text
                  style={tw`text-xl font-bold text-foreground dark:text-white`}
                >
                  Complete registration
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRegistrationCheckout(false)}
                style={tw`h-10 w-10 items-center justify-center rounded-full bg-surface dark:bg-[#0A173F]`}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={color("white", "foreground")}
                />
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
              <View style={tw`rounded-2xl bg-surface dark:bg-[#08143B] p-4`}>
                <Text
                  style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#8FA1CB]`}
                >
                  Registration total
                </Text>
                <Text
                  style={tw`mt-2 text-2xl font-bold text-foreground dark:text-white`}
                >
                  {formatCheckoutAmount(registrationPreview.chargeAmountNaira)}
                </Text>
                <Text
                  style={tw`mt-2 text-sm leading-5 text-secondary dark:text-[#B7C5E9]`}
                >
                  This registration will be issued to your GatherGo account.
                </Text>
              </View>

              <CustomButton
                onPress={() => {
                  setShowRegistrationCheckout(false);
                  handleTransaction(true);
                }}
                disabled={hasEventEnded || registrationDisabled}
                buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 w-full"
                textClassName="!text-onAccent dark:text-black"
                arrowCircleColor="bg-accentFill dark:bg-[#0C7F7F]"
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

      <EventShareSheet visible={shareVisible} onClose={() => setShareVisible(false)} eventId={resolvedEventId} title={data.data.title} foodBank={registrationType === 'foodbank'} imageUrl={data.data.isImageProcessing ? null : imageUrl} />
      {/* BottomSheet for Donation */}
      <BottomSheetModal
        containerStyle={sheetContainerStyle}
        topInset={layout.insets.top}
        bottomInset={layout.insets.bottom}
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
        backgroundStyle={{ backgroundColor: color("#01082E", "background") }}
      >
        <BottomSheetScrollView
          style={tw`p-5`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={tw`flex-row justify-between items-center mb-5`}>
            <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>
              Make a Donation
            </Text>
            {/* <TouchableOpacity onPress={closeDonationSheet} style={tw`p-2`}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity> */}
          </View>

          {registrationType === "foodbank" ? (
            <InfoDisclosure
              label="Donation info"
              message="Donations support this food bank and are not a payment for food. Your first donation includes one meal pass while collection windows are available. Additional donations do not issue another pass."
            />
          ) : null}
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

          <CustomView className="max-w-full" style={tw`mb-6`}>
            <Text style={tw`text-foreground dark:text-white mb-3 font-medium`}>
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
                      ? "bg-accentFill dark:bg-[#0FF1CF]"
                      : "bg-surface dark:bg-[#101C45]"
                  }`}
                >
                  <Text
                    style={tw`${
                      donationAmount === amount.toString()
                        ? "text-onAccent dark:text-[#01082E] font-bold"
                        : "text-foreground dark:text-white"
                    }`}
                  >
                    ₦{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount Input */}
            <View
              style={tw`flex-row items-center bg-surface dark:bg-[#101C45] border border-borderStrong dark:border-transparent rounded-xl px-4 py-3`}
            >
              <Text style={tw`text-foreground dark:text-white text-lg mr-2`}>
                ₦
              </Text>
              <BottomSheetTextInput
                style={tw`flex-1 text-foreground dark:text-white text-lg`}
                value={donationAmount}
                onChangeText={setDonationAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                onPress={() => setDonationAmount("500")}
                style={tw`bg-accentFill dark:bg-[#0FF1CF] px-3 py-1 rounded-lg`}
              >
                <Text style={tw`text-onAccent dark:text-[#01082E] text-sm`}>
                  Min
                </Text>
              </TouchableOpacity>
            </View>

            {parseFloat(donationAmount || "0") < 500 && (
              <Text style={tw`text-danger dark:text-red-500 text-sm mt-2`}>
                Minimum donation is ₦500
              </Text>
            )}
          </CustomView>

          <CustomView className="max-w-full" style={tw`mb-6`}>
            <Text style={tw`text-foreground dark:text-white mb-3 font-medium`}>
              Optional Message (Optional)
            </Text>
            <BottomSheetTextInput
              autoCapitalize="none"
              style={tw`bg-surface dark:bg-[#101C45] border border-borderStrong dark:border-transparent rounded-xl px-4 py-3 text-foreground dark:text-white min-h-[100px]`}
              value={donationMessage}
              onChangeText={setDonationMessage}
              placeholder="Add a message of support..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </CustomView>

          <CustomView className="max-w-full" style={tw`mb-6`}>
            <TouchableOpacity
              style={tw`flex-row items-center justify-between p-3 bg-surface dark:bg-[#101C45] rounded-xl`}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={tw`flex-row items-center`}>
                <View
                  style={tw`w-6 h-6 rounded-md border-2 ${
                    isAnonymous
                      ? "bg-accentFill dark:bg-[#0FF1CF] border-accent dark:border-[#0FF1CF]"
                      : "border-border dark:border-gray-500"
                  } mr-3 items-center justify-center`}
                >
                  {isAnonymous && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={color("#01082E", "onAccent")}
                    />
                  )}
                </View>
                <View>
                  <Text style={tw`text-foreground dark:text-white font-medium`}>
                    Donate anonymously
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isAnonymous ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={isAnonymous ? color("#0FF1CF", "accent") : "gray"}
              />
            </TouchableOpacity>
          </CustomView>

          {renderProviderSelector(
            Number(parseFloat(donationAmount || "0") || 0),
            "red"
          )}

          <CustomView className="max-w-full" style={tw`mb-7`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={color("#0FF1CF", "accent")}
              />
              <Text style={tw`text-foreground dark:text-white ml-2 text-sm`}>
                {selectedProvider === "ALAT_TRANSFER"
                  ? "Bank transfer checkout via ALAT"
                  : "Secure payment powered by Paystack"}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name="information-circle"
                size={20}
                color={color("#0FF1CF", "accent")}
              />
              <Text style={tw`text-foreground dark:text-white ml-2 text-sm`}>
                {selectedProvider === "ALAT_TRANSFER"
                  ? "We’ll show transfer instructions after you confirm the donation."
                  : "All donations are processed securely."}
              </Text>
            </View>
          </CustomView>
        </BottomSheetScrollView>

        <View style={tw`w-full max-w-[640px] self-center p-5`}>
          <CustomButton
            onPress={() => {
              handleDonation();
            }}
            disabled={
              hasEventEnded ||
              initiatingDonation ||
              parseFloat(donationAmount || "0") < 500
            }
            buttonClassName="bg-danger dark:bg-[#FF6B6B] w-full border-0"
            textClassName="!text-onPrimary dark:text-white"
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
          refreshing: feedRefreshing,
          error,
          hideFeed,
          loadMore: loadMore, // This is the loadMore function
          refresh,
        }}
      />

      <Modal
        visible={showTransferInstructions}
        transparent
        animationType="slide"
      >
        <View style={tw`flex-1 justify-end bg-black/60 px-5 py-8`}>
          <View style={tw`rounded-[28px] bg-background dark:bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <View
                style={tw`rounded-full bg-accentFill/15 dark:bg-[#0FF1CF]/15 px-3 py-1.5`}
              >
                <Text
                  style={tw`text-[11px] font-semibold uppercase tracking-wider text-accent dark:text-[#0FF1CF]`}
                >
                  ALAT transfer
                </Text>
              </View>
              <View
                style={tw`rounded-full border border-border dark:border-[#2A3E6A] px-3 py-1.5`}
              >
                <Text
                  style={tw`text-[11px] font-semibold uppercase tracking-wider text-foreground dark:text-white`}
                >
                  Awaiting payment
                </Text>
              </View>
            </View>
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <Text
                style={tw`flex-1 text-xl font-bold text-foreground dark:text-white`}
              >
                Complete your transfer
              </Text>
              <SheetCloseButton
                accessibilityLabel="Close transfer instructions"
                onPress={() => setShowTransferInstructions(false)}
              />
            </View>

            <View
              style={tw`mt-4 gap-2 rounded-3xl bg-surface dark:bg-[#09173A] p-4`}
            >
              <View style={tw`flex-row items-start gap-3`}>
                <View
                  style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-accentFill dark:bg-[#0FF1CF]`}
                >
                  <Text
                    style={tw`text-[11px] font-bold text-onAccent dark:text-[#01082E]`}
                  >
                    1
                  </Text>
                </View>
                <Text
                  style={tw`flex-1 text-sm leading-5 text-foreground dark:text-white`}
                >
                  Transfer exactly{" "}
                  {formatCheckoutAmount(
                    transferInstructions?.amountInNaira || 0
                  )}{" "}
                  to the account below.
                </Text>
              </View>
              <View style={tw`flex-row items-start gap-3`}>
                <View
                  style={tw`mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-accentFill dark:bg-[#0FF1CF]`}
                >
                  <Text
                    style={tw`text-[11px] font-bold text-onAccent dark:text-[#01082E]`}
                  >
                    2
                  </Text>
                </View>
                <Text
                  style={tw`flex-1 text-sm leading-5 text-foreground dark:text-white`}
                >
                  Come back here after payment to track confirmation.
                </Text>
              </View>
            </View>

            <View
              style={tw`mt-5 gap-3 rounded-3xl bg-surface dark:bg-[#0A173F] p-4`}
            >
              <View>
                <Text
                  style={tw`text-xs uppercase text-muted dark:text-[#8FA1CB]`}
                >
                  Amount
                </Text>
                <Text
                  style={tw`mt-1 text-lg font-bold text-accent dark:text-[#0FF1CF]`}
                >
                  {formatCheckoutAmount(
                    transferInstructions?.amountInNaira || 0
                  )}
                </Text>
              </View>
              <View>
                <Text
                  style={tw`text-xs uppercase text-muted dark:text-[#8FA1CB]`}
                >
                  Bank
                </Text>
                <Text
                  style={tw`mt-1 text-sm font-semibold text-foreground dark:text-white`}
                >
                  {transferInstructions?.bankName || "Wema Bank"}
                </Text>
              </View>
              <View>
                <Text
                  style={tw`text-xs uppercase text-muted dark:text-[#8FA1CB]`}
                >
                  Account name
                </Text>
                <Text
                  style={tw`mt-1 text-sm font-semibold text-foreground dark:text-white`}
                >
                  {transferInstructions?.accountName ||
                    paymentOptions?.alatTransferDisplayName ||
                    "GatherGo"}
                </Text>
              </View>
              <View>
                <Text
                  style={tw`text-xs uppercase text-muted dark:text-[#8FA1CB]`}
                >
                  Account number
                </Text>
                <View style={tw.style("flex-row items-center gap-5")}>
                  <Text
                    selectable
                    style={tw` text-lg font-bold text-foreground dark:text-white`}
                  >
                    {transferInstructions?.accountNumber || "-"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => void handleCopyAccountNumber()}
                    disabled={!transferInstructions?.accountNumber}
                    style={tw.style(
                      " self-start rounded-full border border-border dark:border-[#2A3E6A] px-3 py-2",
                      !transferInstructions?.accountNumber && "opacity-50"
                    )}
                  >
                    <Text
                      style={tw`text-xs font-semibold uppercase tracking-wide text-foreground dark:text-white`}
                    >
                      Copy number
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <Text
                  style={tw`text-xs uppercase text-muted dark:text-[#8FA1CB]`}
                >
                  Expires in
                </Text>
                <Text
                  style={tw`mt-1 text-lg font-bold text-warning dark:text-[#FFD76A]`}
                >
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
              style={tw`mt-5 rounded-full bg-accentFill dark:bg-[#0FF1CF] px-4 py-4`}
            >
              <Text
                style={tw`text-center text-sm font-semibold text-onAccent dark:text-[#01082E]`}
              >
                I’ve made the transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <AppToast />
      </Modal>

      <Modal visible={showImpactReportModal} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/65 px-5 py-8`}>
          <View
            style={tw`max-h-[88%] rounded-[28px] bg-background dark:bg-[#041130] p-5`}
          >
            <View style={tw`flex-row items-start justify-between gap-3`}>
              <View style={tw`flex-1`}>
                <Text
                  style={tw`text-xl font-bold text-foreground dark:text-white`}
                >
                  {impactReport ? "Edit impact report" : "Submit impact report"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowImpactReportModal(false)}
                style={tw`h-10 w-10 items-center justify-center rounded-full bg-surface dark:bg-[#0A173F]`}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={color("white", "foreground")}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={tw`mt-5`}
              contentContainerStyle={tw`pb-4`}
              keyboardShouldPersistTaps="handled"
            >
              <View style={tw`gap-2`}>
                <Text
                  style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}
                >
                  Summary
                </Text>
                <TextInput
                  autoCapitalize="none"
                  value={impactReportSummary}
                  onChangeText={setImpactReportSummary}
                  placeholder="What happened, who benefited, and what changed?"
                  placeholderTextColor={color("#8FA1CB", "muted")}
                  multiline
                  maxLength={1000}
                  style={tw`min-h-[110px] rounded-2xl border border-borderStrong dark:border-transparent bg-surface dark:bg-[#101C45] p-4 text-foreground dark:text-white`}
                />
              </View>

              <View style={tw`mt-5 gap-3`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <Text
                    style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}
                  >
                    Outcomes
                  </Text>
                  <TouchableOpacity
                    onPress={addImpactReportOutcome}
                    style={tw`rounded-full bg-accentFill/15 dark:bg-[#0FF1CF]/15 px-3 py-2`}
                  >
                    <Text
                      style={tw`text-xs font-bold text-accent dark:text-[#0FF1CF]`}
                    >
                      Add outcome
                    </Text>
                  </TouchableOpacity>
                </View>

                {impactReportOutcomes.map((outcome, index) => (
                  <View
                    key={outcome.id || index}
                    style={tw`rounded-2xl bg-surface dark:bg-[#08143B] p-4`}
                  >
                    <View style={tw`flex-row items-center justify-between`}>
                      <Text
                        style={tw`text-sm font-semibold text-foreground dark:text-white`}
                      >
                        Outcome {index + 1}
                      </Text>
                      {impactReportOutcomes.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeImpactReportOutcome(index)}
                        >
                          <Text
                            style={tw`text-xs font-semibold text-danger dark:text-[#FF8A8A]`}
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
                      placeholderTextColor={color("#8FA1CB", "muted")}
                      style={tw`mt-3 rounded-2xl border border-borderStrong dark:border-transparent bg-surface dark:bg-[#101C45] px-4 py-3 text-foreground dark:text-white`}
                    />

                    <View style={tw`mt-3 flex-row gap-3`}>
                      <TextInput
                        value={outcome.value}
                        onChangeText={(value) =>
                          updateImpactReportOutcome(index, { value })
                        }
                        placeholder="Value"
                        placeholderTextColor={color("#8FA1CB", "muted")}
                        keyboardType="numeric"
                        style={tw`flex-1 rounded-2xl border border-borderStrong dark:border-transparent bg-surface dark:bg-[#101C45] px-4 py-3 text-foreground dark:text-white`}
                      />
                      <TextInput
                        autoCapitalize="none"
                        value={outcome.unit}
                        onChangeText={(value) =>
                          updateImpactReportOutcome(index, { unit: value })
                        }
                        placeholder="Unit"
                        placeholderTextColor={color("#8FA1CB", "muted")}
                        style={tw`flex-1 rounded-2xl border border-borderStrong dark:border-transparent bg-surface dark:bg-[#101C45] px-4 py-3 text-foreground dark:text-white`}
                      />
                    </View>

                    <TextInput
                      autoCapitalize="none"
                      value={outcome.note}
                      onChangeText={(value) =>
                        updateImpactReportOutcome(index, { note: value })
                      }
                      placeholder="Optional note"
                      placeholderTextColor={color("#8FA1CB", "muted")}
                      multiline
                      style={tw`mt-3 min-h-[72px] rounded-2xl border border-borderStrong dark:border-transparent bg-surface dark:bg-[#101C45] px-4 py-3 text-foreground dark:text-white`}
                    />
                  </View>
                ))}
              </View>

              <View style={tw`mt-5 gap-2`}>
                <Text
                  style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}
                >
                  Evidence links
                </Text>
                <TextInput
                  autoCapitalize="none"
                  value={impactReportEvidenceText}
                  onChangeText={setImpactReportEvidenceText}
                  placeholder="Paste up to 5 links, one per line"
                  placeholderTextColor={color("#8FA1CB", "muted")}
                  multiline
                  style={tw`min-h-[92px] rounded-2xl bg-surface dark:bg-[#101C45] p-4 text-foreground dark:text-white`}
                />
              </View>

              <View style={tw`mt-6 gap-3`}>
                <CustomButton
                  onPress={submitImpactReport}
                  disabled={submittingImpactReport}
                  buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 w-full"
                  textClassName="!text-onAccent dark:text-black"
                  arrowCircleColor="bg-accentFill dark:bg-[#0C7F7F]"
                  title={
                    submittingImpactReport ? "Publishing" : "Publish report"
                  }
                />
                <TouchableOpacity
                  onPress={() => setShowImpactReportModal(false)}
                  style={tw`rounded-xl border border-border dark:border-[#2A3E6A] px-4 py-4`}
                >
                  <Text
                    style={tw`text-center text-sm font-semibold text-foreground dark:text-white`}
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
          clearPaymentState();
          router.replace(
            `/transaction/${currentTransactionId}?type=${transactionType}`
          );
        }}
        onCancel={() => {
          void handlePaymentCancel();
        }}
        onError={(error) => {
          console.error("Payment error:", error);
          showGlobalError("Check payment status before trying again.");
          openCheckoutStatus(currentTransactionId, transactionType);
        }}
      />
    </SafeAreaView>
  );
};

export default EventPage;
