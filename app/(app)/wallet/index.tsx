import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import ActivityIndicator from "@/components/ui/AppLoader";
import { useAuth } from "@/context/AuthContext";
import {
  useNotifyOnKycResolution,
  useStartBusinessKyc,
  useStartBusinessRepresentativeKyc,
  useStartPersonalKyc,
  useSubmitWalletKyc,
  useSubmitWalletLiveness,
  useUpsertWalletPayoutProfile,
} from "@/services/mutations";
import {
  useWalletBanks,
  useWalletKyc,
  useWalletOnboarding,
  useWalletOverview,
} from "@/services/queries";
import {
  AccountOwnershipType,
  KycVerificationMode,
  NotifyOnKycResolutionTarget,
  WalletBank,
  WalletKycData,
  WalletOnboardingData,
} from "@/types/wallet";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { safeGoBack } from "@/utils/navigation";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  BadgeAlert,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react-native";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const EMPTY_BANKS: WalletBank[] = [];
const FAST_BANK_PREVIEW_LIMIT = 20;

const formatMoney = (amount?: number | null) => {
  const value = Number(amount || 0);
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const toTitleCase = (value?: string | null) => {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusTone = (status?: string | null) => {
  switch (status) {
    case "ACTIVE":
    case "VERIFIED":
    case "MATCHED":
    case "SUCCESS":
      return {
        bg: "#0F3A32",
        text: "#65F5C7",
      };
    case "PENDING_KYC":
    case "IN_PROGRESS":
    case "PENDING_PROVIDER":
    case "SUBMITTED":
    case "PENDING_REVIEW":
    case "PROCESSING":
    case "READY":
    case "HELD_KYC":
      return {
        bg: "#3A300F",
        text: "#FFD76A",
      };
    case "REJECTED":
    case "FAILED":
    case "MISMATCH":
    case "RESTRICTED":
    case "HELD_RISK":
      return {
        bg: "#3E1822",
        text: "#FF8FA9",
      };
    default:
      return {
        bg: "#1E2A4C",
        text: "#C9D4FF",
      };
  }
};

const getWalletFriendlyErrorMessage = (error: any, fallback: string) => {
  const statusCode = error?.response?.status;
  const rawMessage =
    typeof error?.response?.data?.message === "string"
      ? error.response.data.message
      : "";

  if (statusCode >= 500) {
    return fallback;
  }

  if (/qoreid|access token|credentials are not configured|bad gateway/i.test(rawMessage)) {
    return fallback;
  }

  return rawMessage || fallback;
};

const getTaskCopy = (onboarding?: WalletOnboardingData | null) => {
  if (onboarding?.kycStatus === "PENDING_PROVIDER") {
    return {
      title: "Verification in progress",
      subtitle:
        "We’ve sent your details to our verification partner and we’re waiting for their response. No action is needed right now.",
      action: "View status",
    };
  }

  switch (onboarding?.nextAction) {
    case "ADD_SETTLEMENT_ACCOUNT":
      return {
        title: "Add your payout account",
        subtitle:
          "Your events can keep collecting payments, but settlements stay on hold until we know where to pay you.",
        action: "Add account",
      };
    case "COMPLETE_KYC":
      return {
        title: "Complete identity verification",
        subtitle:
          "We need to verify that your payout account belongs to you before we can release earnings.",
        action: "Continue KYC",
      };
    case "ALAT_ACTIVATION":
      return {
        title: "ALAT transfer is pending activation",
        subtitle:
          "Your payout setup is in progress. We’ll enable ALAT transfer after internal review is complete.",
        action: "View status",
      };
    default:
      return {
        title: "Your wallet is in good shape",
        subtitle:
          "You can track earnings, payout readiness, and recent settlement activity here.",
        action: "View details",
      };
  }
};

const splitFullName = (value?: string | null) => {
  const parts = (value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};


const normalizePersonalVerificationMode = (
  mode?: KycVerificationMode | null
): KycVerificationMode => {
  switch (mode) {
    case "PERSONAL_VNIN":
    case "PERSONAL_PASSPORT":
    case "PERSONAL_NIN":
      return mode;
    default:
      return "PERSONAL_NIN";
  }
};

const normalizeBusinessVerificationMode = (
  mode?: KycVerificationMode | null
): KycVerificationMode => {
  switch (mode) {
    case "BUSINESS_CAC_REP_VNIN":
    case "BUSINESS_CAC_REP_PASSPORT":
    case "BUSINESS_CAC_REP_NIN":
      return mode;
    default:
      return "BUSINESS_CAC_REP_NIN";
  }
};

const getPendingResolutionTarget = (
  key?: string | null
): NotifyOnKycResolutionTarget | null => {
  switch (key) {
    case "business":
      return "BUSINESS";
    case "identity":
      return "IDENTITY";
    case "liveness":
      return "LIVENESS";
    default:
      return null;
  }
};

const SectionCard = ({
  title,
  subtitle,
  actionText,
  onPressAction,
  children,
}: {
  title: string;
  subtitle?: string;
  actionText?: string;
  onPressAction?: () => void;
  children: ReactNode;
}) => (
  <CustomView
    style={tw.style(
      "rounded-3xl border border-[#24345A] bg-[#08143B] p-4",
    )}
  >
    <View style={tw`flex-row items-start justify-between gap-3`}>
      <View style={tw`flex-1`}>
        <Text style={tw`text-white text-lg font-semibold`}>{title}</Text>
        {subtitle ? (
          <Text style={tw`mt-1 text-sm leading-5 text-[#9FB0D8]`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionText && onPressAction ? (
        <TouchableOpacity
          onPress={onPressAction}
          style={tw`rounded-full bg-[#0FF1CF] px-4 py-2`}
        >
          <Text style={tw`text-xs font-semibold text-[#03122F]`}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    <View style={tw`mt-4`}>{children}</View>
  </CustomView>
);

const StatusPill = ({ label }: { label?: string | null }) => {
  const tone = getStatusTone(label);

  return (
    <View
      style={tw.style("self-start rounded-full px-3 py-1", {
        backgroundColor: tone.bg,
      })}
    >
      <Text style={tw.style("text-xs font-semibold", { color: tone.text })}>
        {toTitleCase(label)}
      </Text>
    </View>
  );
};

const CompletedStepBadge = () => (
  <View style={tw`rounded-full bg-[#123F32] px-3 py-1`}>
    <Text style={tw`text-[11px] font-semibold uppercase tracking-wide text-[#8AF0C4]`}>
      Completed
    </Text>
  </View>
);

const StepCard = ({
  stepLabel,
  title,
  description,
  collapsed = false,
  summary,
  children,
}: {
  stepLabel: string;
  title: string;
  description: string;
  collapsed?: boolean;
  summary?: string;
  children?: ReactNode;
}) => {
  if (collapsed) {
    return (
      <View style={tw`mt-5 rounded-2xl border border-[#24345A] bg-[#08153C] p-4`}>
        <View style={tw`flex-row items-center justify-between gap-3`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
              {stepLabel}
            </Text>
            <Text style={tw`mt-2 text-sm font-semibold text-white`}>{title}</Text>
            <View style={tw`mt-2 flex-row items-start gap-2`}>
              <CheckCircle2 size={16} color="#8AF0C4" style={tw`mt-0.5`} />
              <Text style={tw`flex-1 text-sm leading-5 text-[#9FD8C4]`}>
                {summary || "This step is complete."}
              </Text>
            </View>
          </View>
          <CompletedStepBadge />
        </View>
      </View>
    );
  }

  return (
    <View style={tw`mt-5 rounded-2xl border border-[#24345A] bg-[#08153C] p-4`}>
      <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
        {stepLabel}
      </Text>
      <Text style={tw`mt-2 text-sm font-semibold text-white`}>{title}</Text>
      <Text style={tw`mt-2 text-sm leading-5 text-[#9FB0D8]`}>{description}</Text>
      {children}
    </View>
  );
};

const WalletScreen = () => {
  const router = useLockedRouter();
  const { user } = useAuth();

  const overviewQuery = useWalletOverview();
  const onboardingQuery = useWalletOnboarding();
  const kycQuery = useWalletKyc();
  const banksQuery = useWalletBanks();

  const payoutProfile = overviewQuery.data?.data?.payoutProfile || null;
  const alatProfile = overviewQuery.data?.data?.alatProfile || null;
  const balance = overviewQuery.data?.data?.balance;
  const transactions = overviewQuery.data?.data?.recentTransactions || [];
  const settlements = overviewQuery.data?.data?.recentSettlements || [];
  const onboarding = onboardingQuery.data?.data;
  const kyc = kycQuery.data?.data;
  const banks = banksQuery.data?.data ?? EMPTY_BANKS;

  const [refreshing, setRefreshing] = useState(false);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [bankSearchModalVisible, setBankSearchModalVisible] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  const [ownershipType, setOwnershipType] = useState<AccountOwnershipType>(
    "PERSONAL"
  );
  const [legalName, setLegalName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bvnLast4, setBvnLast4] = useState("");

  const [personalVerificationMode, setPersonalVerificationMode] =
    useState<KycVerificationMode>("PERSONAL_NIN");
  const [personalPhoneNumber, setPersonalPhoneNumber] = useState("");
  const [personalNin, setPersonalNin] = useState("");
  const [personalVnin, setPersonalVnin] = useState("");
  const [personalPassportNumber, setPersonalPassportNumber] = useState("");
  const [personalFirstName, setPersonalFirstName] = useState("");
  const [personalLastName, setPersonalLastName] = useState("");
  const [personalDob, setPersonalDob] = useState("");

  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [businessDisplayName, setBusinessDisplayName] = useState("");
  const [representativeVerificationMode, setRepresentativeVerificationMode] =
    useState<KycVerificationMode>("BUSINESS_CAC_REP_NIN");
  const [representativeFirstName, setRepresentativeFirstName] = useState("");
  const [representativeLastName, setRepresentativeLastName] = useState("");
  const [representativeDob, setRepresentativeDob] = useState("");
  const [representativePhone, setRepresentativePhone] = useState("");
  const [representativeNin, setRepresentativeNin] = useState("");
  const [representativeVnin, setRepresentativeVnin] = useState("");
  const [representativePassportNumber, setRepresentativePassportNumber] = useState("");

  const [selectedSelfie, setSelectedSelfie] = useState<{
    uri: string;
    base64?: string | null;
  } | null>(null);

  const payoutMutation = useUpsertWalletPayoutProfile({
    onSuccess: () => {
      showGlobalSuccess("Payout account saved. Continue KYC to unlock settlements.");
      setPayoutModalVisible(false);
      setKycModalVisible(true);
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't verify this payout account right now. Please try again later."
        )
      );
    },
  });

  const startPersonalKycMutation = useStartPersonalKyc({
    onSuccess: () => {
      showGlobalSuccess("Personal identity check started.");
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't start identity verification right now. Please try again later."
        )
      );
    },
  });

  const startBusinessKycMutation = useStartBusinessKyc({
    onSuccess: () => {
      showGlobalSuccess("Business verification started. Once CAC is confirmed, you can continue with the representative.");
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't start business verification right now. Please try again later."
        )
      );
    },
  });

  const startBusinessRepresentativeKycMutation = useStartBusinessRepresentativeKyc({
    onSuccess: () => {
      showGlobalSuccess("Representative identity check started.");
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't start representative verification right now. Please try again later."
        )
      );
    },
  });

  const submitLivenessMutation = useSubmitWalletLiveness({
    onSuccess: () => {
      showGlobalSuccess("Selfie submitted. You can now send your KYC for review.");
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't submit face verification right now. Please try again later."
        )
      );
    },
  });

  const submitKycMutation = useSubmitWalletKyc({
    onSuccess: () => {
      showGlobalSuccess("KYC submitted for review.");
      setKycModalVisible(false);
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't submit your verification right now. Please try again later."
        )
      );
    },
  });

  const notifyOnKycResolutionMutation = useNotifyOnKycResolution();

  useEffect(() => {
    const profileOwnership =
      payoutProfile?.accountOwnershipType && payoutProfile.accountOwnershipType !== "UNKNOWN"
        ? payoutProfile.accountOwnershipType
        : "PERSONAL";

    setOwnershipType(profileOwnership);
    setLegalName(payoutProfile?.legalName || user?.name || "");
    setBusinessName(payoutProfile?.businessName || "");
    setSelectedBankCode(payoutProfile?.bankCode || "");
    setAccountNumber(payoutProfile?.accountNumber || "");
    setAccountName(payoutProfile?.accountName || "");
    setBvnLast4(payoutProfile?.bvnLast4 || "");
  }, [payoutProfile, user?.name]);

  useEffect(() => {
    const personalNameParts = splitFullName(
      payoutProfile?.legalName || kyc?.verifiedFullName || user?.name || ""
    );
    const representativeNameParts = splitFullName(
      kyc?.verifiedFullName || payoutProfile?.legalName || user?.name || ""
    );

    setPersonalFirstName(personalNameParts.firstName);
    setPersonalLastName(personalNameParts.lastName);
    setPersonalPhoneNumber(user?.phoneNumber || "");
    setPersonalVerificationMode(
      normalizePersonalVerificationMode(kyc?.verificationMode)
    );

    setBusinessDisplayName(payoutProfile?.businessName || "");
    setRepresentativeVerificationMode(
      normalizeBusinessVerificationMode(kyc?.verificationMode)
    );
    setRepresentativeFirstName(representativeNameParts.firstName);
    setRepresentativeLastName(representativeNameParts.lastName);
    setRepresentativePhone(user?.phoneNumber || "");
  }, [
    payoutProfile?.legalName,
    payoutProfile?.businessName,
    kyc?.verifiedFullName,
    kyc?.verificationMode,
    user?.name,
    user?.phoneNumber,
  ]);

  useEffect(() => {
    if (!selectedBankCode && banks.length > 0) {
      const firstBank = banks.find((bank) => bank.code) || banks[0];
      if (firstBank?.code) {
        setSelectedBankCode(firstBank.code);
      }
    }
  }, [banks, selectedBankCode]);

  const selectedBank = useMemo(() => {
    return banks.find((bank) => bank.code === selectedBankCode) || null;
  }, [banks, selectedBankCode]);

  const filteredBanks = useMemo(() => {
    const query = bankSearchQuery.trim().toLowerCase();

    if (!query) {
      return banks;
    }

    return banks.filter((bank) => {
      const name = bank.name?.toLowerCase() || "";
      const code = bank.code?.toLowerCase() || "";
      const longcode = bank.longcode?.toLowerCase() || "";

      return (
        name.includes(query) ||
        code.includes(query) ||
        longcode.includes(query)
      );
    });
  }, [bankSearchQuery, banks]);

  const visibleBanks = useMemo(() => {
    if (bankSearchQuery.trim()) {
      return filteredBanks;
    }

    const prioritizedBanks: WalletBank[] = [];

    if (selectedBank?.code) {
      prioritizedBanks.push(selectedBank);
    }

    for (const bank of banks) {
      if (prioritizedBanks.some((entry) => entry.code === bank.code)) {
        continue;
      }

      prioritizedBanks.push(bank);

      if (prioritizedBanks.length >= FAST_BANK_PREVIEW_LIMIT) {
        break;
      }
    }

    return prioritizedBanks;
  }, [bankSearchQuery, filteredBanks, banks, selectedBank]);

  const onboardingCopy = getTaskCopy(onboarding);
  const currentOwnershipType = ownershipType;


  const currentPersonalVerificationMode =
    normalizePersonalVerificationMode(personalVerificationMode);
  const currentBusinessVerificationMode =
    normalizeBusinessVerificationMode(representativeVerificationMode);

  const personalIdentityNumber =
    currentPersonalVerificationMode === "PERSONAL_VNIN"
      ? personalVnin.trim()
      : currentPersonalVerificationMode === "PERSONAL_PASSPORT"
        ? personalPassportNumber.trim()
        : personalNin.trim();

  const representativeIdentityNumber =
    currentBusinessVerificationMode === "BUSINESS_CAC_REP_VNIN"
      ? representativeVnin.trim()
      : currentBusinessVerificationMode === "BUSINESS_CAC_REP_PASSPORT"
        ? representativePassportNumber.trim()
        : representativeNin.trim();

  const isBusinessVerificationVerified = kyc?.businessStatus === "VERIFIED";
  const isBusinessVerificationPending = kyc?.businessStatus === "PENDING_PROVIDER";
  const isBusinessVerificationRejected = kyc?.businessStatus === "REJECTED";
  const isIdentityVerified = kyc?.identityStatus === "VERIFIED";
  const isIdentityPending = kyc?.identityStatus === "PENDING_PROVIDER";
  const isIdentityRejected = kyc?.identityStatus === "REJECTED";
  const isLivenessVerified = kyc?.livenessStatus === "VERIFIED";
  const isKycSubmitted =
    kyc?.status === "SUBMITTED" || kyc?.status === "VERIFIED";
  const canStartBusinessRepresentative =
    currentOwnershipType === "BUSINESS" && isBusinessVerificationVerified;
  const canSubmitLiveness =
    currentOwnershipType === "BUSINESS"
      ? isBusinessVerificationVerified && isIdentityVerified
      : isIdentityVerified;
  const canSubmitKyc =
    currentOwnershipType === "BUSINESS"
      ? isBusinessVerificationVerified && isIdentityVerified && isLivenessVerified
      : isIdentityVerified && isLivenessVerified;

  const pendingProviderState = useMemo(() => {
    if (currentOwnershipType === "BUSINESS" && kyc?.businessStatus === "PENDING_PROVIDER") {
      return {
        key: "business",
        title: "Business verification in progress",
        description:
          "We’ve submitted your CAC details and we’re waiting for our verification partner to respond.",
      };
    }

    if (kyc?.identityStatus === "PENDING_PROVIDER") {
      return {
        key: "identity",
        title:
          currentOwnershipType === "BUSINESS"
            ? "Representative verification in progress"
            : "Identity verification in progress",
        description:
          currentOwnershipType === "BUSINESS"
            ? "We’ve submitted the representative details and we’re waiting for our verification partner to respond."
            : "We’ve submitted your identity details and we’re waiting for our verification partner to respond.",
      };
    }

    if (kyc?.livenessStatus === "PENDING_PROVIDER") {
      return {
        key: "liveness",
        title: "Face match in progress",
        description:
          "Your selfie has been sent for face match. We’re waiting for our verification partner to finish processing it.",
      };
    }

    return null;
  }, [
    currentOwnershipType,
    kyc?.businessStatus,
    kyc?.identityStatus,
    kyc?.livenessStatus,
  ]);
  const [pendingProviderCountdown, setPendingProviderCountdown] = useState(45);
  const pendingProviderTimedOut = pendingProviderCountdown === 0;

  const busy =
    payoutMutation.isPending ||
    startPersonalKycMutation.isPending ||
    startBusinessKycMutation.isPending ||
    startBusinessRepresentativeKycMutation.isPending ||
    submitLivenessMutation.isPending ||
    submitKycMutation.isPending ||
    notifyOnKycResolutionMutation.isPending;

  const isInitialLoading =
    overviewQuery.isLoading || onboardingQuery.isLoading || kycQuery.isLoading;

  const syncPendingProviderStatus = useCallback(async () => {
    await Promise.all([
      overviewQuery.refetch(),
      onboardingQuery.refetch(),
      kycQuery.refetch(),
    ]);
  }, [overviewQuery, onboardingQuery, kycQuery]);

  useEffect(() => {
    if (!kycModalVisible || !pendingProviderState?.key) {
      setPendingProviderCountdown(45);
      return;
    }

    setPendingProviderCountdown(45);
  }, [kycModalVisible, pendingProviderState?.key]);

  useEffect(() => {
    if (!kycModalVisible || !pendingProviderState?.key || pendingProviderTimedOut) {
      return;
    }

    const countdownTimer = setInterval(() => {
      setPendingProviderCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [kycModalVisible, pendingProviderState?.key, pendingProviderTimedOut]);

  useEffect(() => {
    if (!kycModalVisible || !pendingProviderState?.key) {
      return;
    }

    const pollTimer = setInterval(() => {
      void syncPendingProviderStatus();
    }, 5000);

    return () => clearInterval(pollTimer);
  }, [kycModalVisible, pendingProviderState?.key, syncPendingProviderStatus]);

  const refetchAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        syncPendingProviderStatus(),
        banksQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const openPayoutModal = () => {
    setPayoutModalVisible(true);
  };

  const openBankSearchModal = () => {
    setBankSearchQuery("");
    setBankSearchModalVisible(true);
  };

  const closeBankSearchModal = () => {
    setBankSearchModalVisible(false);
    setBankSearchQuery("");
  };

  const handleSelectBank = (bank: WalletBank) => {
    if (!bank.code) {
      return;
    }

    setSelectedBankCode(bank.code);
    closeBankSearchModal();
  };

  const openKycModal = () => {
    if (!payoutProfile?.bankName || !payoutProfile?.accountNumberMasked) {
      showGlobalWarning("Add your settlement account first.");
      setPayoutModalVisible(true);
      return;
    }

    setKycModalVisible(true);
  };

  const handleSavePayoutProfile = async () => {
    if (!selectedBankCode || !selectedBank?.name) {
      showGlobalWarning("Choose the bank that matches your settlement account.");
      return;
    }

    if (!accountNumber.trim()) {
      showGlobalWarning("Enter the settlement account number.");
      return;
    }

    if (currentOwnershipType === "PERSONAL" && !legalName.trim()) {
      showGlobalWarning("Enter the legal name tied to the account.");
      return;
    }

    if (currentOwnershipType === "BUSINESS") {
      if (!businessName.trim()) {
        showGlobalWarning("Enter the registered business name.");
        return;
      }

    }

    await payoutMutation.mutateAsync({
      accountOwnershipType: currentOwnershipType,
      legalName: currentOwnershipType === "PERSONAL" ? legalName.trim() : undefined,
      businessName:
        currentOwnershipType === "BUSINESS" ? businessName.trim() : undefined,
      bankCode: selectedBankCode,
      bankName: selectedBank.name,
      accountNumber: accountNumber.trim(),
      accountName:
        currentOwnershipType === "BUSINESS" ? accountName.trim() : undefined,
      bvnLast4: bvnLast4.trim() || undefined,
    });
  };

  const handleStartPersonalKyc = async () => {
    if (!personalFirstName.trim() || !personalLastName.trim()) {
      showGlobalWarning("Enter your first and last name for the identity check.");
      return;
    }

    if (currentPersonalVerificationMode === "PERSONAL_NIN" && !personalNin.trim()) {
      showGlobalWarning("Enter your NIN to continue.");
      return;
    }

    if (currentPersonalVerificationMode === "PERSONAL_VNIN" && !personalVnin.trim()) {
      showGlobalWarning("Enter your vNIN to continue.");
      return;
    }

    if (
      currentPersonalVerificationMode === "PERSONAL_PASSPORT" &&
      !personalPassportNumber.trim()
    ) {
      showGlobalWarning("Enter your passport number to continue.");
      return;
    }

    await startPersonalKycMutation.mutateAsync({
      verificationMode: currentPersonalVerificationMode,
      phoneNumber: personalPhoneNumber.trim() || undefined,
      nin: currentPersonalVerificationMode === "PERSONAL_NIN" ? personalNin.trim() || undefined : undefined,
      vnin: currentPersonalVerificationMode === "PERSONAL_VNIN" ? personalVnin.trim() || undefined : undefined,
      passportNumber:
        currentPersonalVerificationMode === "PERSONAL_PASSPORT"
          ? personalPassportNumber.trim() || undefined
          : undefined,
      firstName: personalFirstName.trim(),
      lastName: personalLastName.trim(),
      dateOfBirth: personalDob.trim() || undefined,
    });
  };

  const handleStartBusinessKyc = async () => {
    if (!businessRegNumber.trim()) {
      showGlobalWarning("Enter the CAC registration number for the business account.");
      return;
    }

    await startBusinessKycMutation.mutateAsync({
      regNumber: businessRegNumber.trim(),
      businessName: businessDisplayName.trim() || undefined,
    });
  };

  const handleStartBusinessRepresentativeKyc = async () => {
    if (!canStartBusinessRepresentative) {
      showGlobalWarning(
        isBusinessVerificationPending
          ? "Business verification is still waiting on provider response."
          : "Verify the CAC record before continuing with the representative."
      );
      return;
    }

    if (!representativeFirstName.trim() || !representativeLastName.trim()) {
      showGlobalWarning("Enter the representative's first and last name.");
      return;
    }

    if (
      currentBusinessVerificationMode === "BUSINESS_CAC_REP_NIN" &&
      !representativeNin.trim()
    ) {
      showGlobalWarning("Enter the representative's NIN to continue.");
      return;
    }

    if (
      currentBusinessVerificationMode === "BUSINESS_CAC_REP_VNIN" &&
      !representativeVnin.trim()
    ) {
      showGlobalWarning("Enter the representative's vNIN to continue.");
      return;
    }

    if (
      currentBusinessVerificationMode === "BUSINESS_CAC_REP_PASSPORT" &&
      !representativePassportNumber.trim()
    ) {
      showGlobalWarning("Enter the representative's passport number to continue.");
      return;
    }

    await startBusinessRepresentativeKycMutation.mutateAsync({
      verificationMode: currentBusinessVerificationMode,
      representativePhoneNumber: representativePhone.trim() || undefined,
      representativeFirstName: representativeFirstName.trim(),
      representativeLastName: representativeLastName.trim(),
      representativeDateOfBirth: representativeDob.trim() || undefined,
      representativeNin:
        currentBusinessVerificationMode === "BUSINESS_CAC_REP_NIN"
          ? representativeNin.trim() || undefined
          : undefined,
      representativeVnin:
        currentBusinessVerificationMode === "BUSINESS_CAC_REP_VNIN"
          ? representativeVnin.trim() || undefined
          : undefined,
      representativePassportNumber:
        currentBusinessVerificationMode === "BUSINESS_CAC_REP_PASSPORT"
          ? representativePassportNumber.trim() || undefined
          : undefined,
    });
  };

  const pickSelfie = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showGlobalWarning("Photo library access is needed to submit your selfie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedSelfie({
        uri: asset?.uri || "",
        base64: asset?.base64 || null,
      });
    }
  };

  const handleSubmitLiveness = async () => {
    if (!canSubmitLiveness) {
      if (currentOwnershipType === "BUSINESS") {
        if (isBusinessVerificationPending) {
          showGlobalWarning("Business verification is still waiting on provider response.");
          return;
        }

        if (!isBusinessVerificationVerified) {
          showGlobalWarning("Verify the CAC record before submitting face match.");
          return;
        }

        if (isIdentityPending) {
          showGlobalWarning(
            "Representative identity verification is still waiting on provider response."
          );
          return;
        }

        showGlobalWarning(
          "Representative identity must be verified before face match can start."
        );
        return;
      }

      showGlobalWarning(
        isIdentityPending
          ? "Identity verification is still waiting on provider response."
          : "Verify your identity before submitting face match."
      );
      return;
    }

    if (!selectedSelfie?.base64) {
      showGlobalWarning("Choose a selfie image before submitting face match.");
      return;
    }

    const identityNumber =
      currentOwnershipType === "BUSINESS"
        ? representativeIdentityNumber
        : personalIdentityNumber;

    if (!identityNumber) {
      showGlobalWarning(
        currentOwnershipType === "BUSINESS"
          ? "Enter the representative's identity number before submitting face match."
          : "Enter your identity number before submitting face match."
      );
      return;
    }

    await submitLivenessMutation.mutateAsync({
      identityNumber,
      photoBase64: selectedSelfie.base64,
    });
  };

  const handleSubmitKyc = () => {
    Alert.alert(
      "Submit KYC",
      "We’ll send your verification details for review. You can still collect payments while payouts stay on hold.",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            await submitKycMutation.mutateAsync();
          },
        },
      ]
    );
  };

  const handleCloseKycModal = useCallback(async () => {
    if (!pendingProviderState?.key) {
      setKycModalVisible(false);
      return;
    }

    const target = getPendingResolutionTarget(pendingProviderState.key);

    if (!target) {
      setKycModalVisible(false);
      return;
    }

    try {
      const response = await notifyOnKycResolutionMutation.mutateAsync({ target });
      setKycModalVisible(false);
      void syncPendingProviderStatus();

      if (response.data?.sent) {
        showGlobalSuccess(
          "This verification step has already resolved. We’ve sent an update to your notifications."
        );
        return;
      }

      showGlobalSuccess(
        "We’ll notify you once this verification step resolves. You can continue later and come back anytime."
      );
    } catch (error: any) {
      showGlobalError(
        error?.response?.data?.message ||
          "We couldn’t save the notification preference for this verification step."
      );
    }
  }, [
    notifyOnKycResolutionMutation,
    pendingProviderState?.key,
    syncPendingProviderStatus,
  ]);

  const handleContinueLater = () => {
    void handleCloseKycModal();
  };

  const renderKycSteps = (data?: WalletKycData | null) => {
    if (!data?.steps?.length) {
      return (
        <Text style={tw`text-sm text-[#9FB0D8]`}>
          Once you start verification, each step will show up here.
        </Text>
      );
    }

    return data.steps.map((step) => (
      <View
        key={step.code}
        style={tw`mb-2 flex-row items-center justify-between rounded-2xl bg-[#0A173F] px-3 py-3`}
      >
        <Text style={tw`flex-1 text-sm font-medium text-white`}>
          {toTitleCase(step.code)}
        </Text>
        <StatusPill label={step.status} />
      </View>
    ));
  };

  if (isInitialLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-[#01082E] px-6`}>
        <ActivityIndicator tone="accent" size="large" />
        <Text style={tw`mt-4 text-center text-sm text-[#B7C5E9]`}>
          Loading your wallet and payout setup...
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#01082E] px-5 pt-10 pb-4`}>
      <CustomeTopBarNav
        title="Wallet"
        onClickBack={() => safeGoBack(router, "/")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
            tintColor="#0FF1CF"
          />
        }
        contentContainerStyle={tw`pb-12 pt-4`}
      >
        <CustomView
          style={tw.style(
            "rounded-[28px] border border-[#1D335E] bg-[#091538] p-5",
            {
              shadowColor: "#0FF1CF",
              shadowOpacity: 0.12,
              shadowRadius: 18,
            }
          )}
        >
          <View style={tw`flex-row items-start justify-between gap-3`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-2xl font-bold text-white`}>
                {balance ? formatMoney(balance.totalCollected) : formatMoney(0)}
              </Text>
              <Text style={tw`mt-2 text-sm leading-5 text-[#B7C5E9]`}>
                Total collected across your paid events.
              </Text>
            </View>
            <View style={tw`rounded-2xl bg-[#0FF1CF]/15 p-3`}>
              <WalletIcon size={22} color="#0FF1CF" />
            </View>
          </View>

          <View style={tw`mt-4 rounded-3xl bg-[#0A173F] p-4`}>
            <View style={tw`flex-row items-start gap-3`}>
              <View style={tw`rounded-2xl bg-[#1B2A50] p-3`}>
                <ShieldCheck size={20} color="#FFD76A" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-semibold text-white`}>
                  {onboardingCopy.title}
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-[#9FB0D8]`}>
                  {onboardingCopy.subtitle}
                </Text>
              </View>
            </View>

            {!!onboarding?.tasks?.length && (
              <View style={tw`mt-4 gap-2`}>
                {onboarding.tasks.map((task) => (
                  <View
                    key={task.code}
                    style={tw`flex-row items-center justify-between rounded-2xl border border-[#21315A] bg-[#081335] px-3 py-3`}
                  >
                    <View style={tw`flex-1 pr-3`}>
                      <Text style={tw`text-sm font-semibold text-white`}>
                        {task.title}
                      </Text>
                      <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                        {task.blocking ? "Required for settlement" : "Optional for more payment options"}
                      </Text>
                    </View>
                    <StatusPill label={task.status} />
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                if (onboarding?.nextAction === "ADD_SETTLEMENT_ACCOUNT") {
                  openPayoutModal();
                  return;
                }

                if (onboarding?.nextAction === "COMPLETE_KYC") {
                  openKycModal();
                  return;
                }

                if (onboarding?.nextAction === "ALAT_ACTIVATION") {
                  showGlobalWarning(
                    "ALAT transfer is waiting for internal activation. Paystack can still be used for collections."
                  );
                  return;
                }

                openKycModal();
              }}
              style={tw`mt-4 flex-row items-center justify-center rounded-full bg-[#0FF1CF] px-4 py-3`}
            >
              <Text style={tw`text-sm font-semibold text-[#03122F]`}>
                {onboardingCopy.action}
              </Text>
              <ArrowRight size={16} color="#03122F" />
            </TouchableOpacity>
          </View>
        </CustomView>

        <CustomView style={tw`flex-row flex-wrap gap-3`}>
          {[
            {
              label: "Available",
              value: formatMoney(balance?.availableBalance),
              icon: CircleDollarSign,
              color: "#0FF1CF",
            },
            {
              label: "Held",
              value: formatMoney(balance?.heldBalance),
              icon: Clock3,
              color: "#FFD76A",
            },
            {
              label: "Processing",
              value: formatMoney(balance?.processingBalance),
              icon: Loader,
              color: "#9FB0D8",
            },
            {
              label: "Settled",
              value: formatMoney(balance?.settledBalance),
              icon: CheckCircle2,
              color: "#7CFFB2",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={tw.style(
                  "min-w-[48%] flex-1 rounded-3xl border border-[#1E3157] bg-[#08143B] p-4"
                )}
              >
                <View style={tw`flex-row items-center justify-between`}>
                  <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
                    {item.label}
                  </Text>
                  <Icon size={18} color={item.color} />
                </View>
                <Text style={tw`mt-3 text-lg font-bold text-white`}>
                  {item.value}
                </Text>
              </View>
            );
          })}
        </CustomView>

        <SectionCard
          title="Payout setup"
          subtitle="Add the bank account we should settle to. If you change it later, we’ll pause payouts until the new details are reviewed again."
          actionText={payoutProfile ? "Update" : "Set up"}
          onPressAction={openPayoutModal}
        >
          {payoutProfile ? (
            <View style={tw`gap-3`}>
              <View style={tw`flex-row flex-wrap gap-2`}>
                <StatusPill label={payoutProfile.status} />
                <StatusPill label={payoutProfile.kycStatus} />
                <StatusPill label={payoutProfile.nameMatchStatus} />
              </View>

              <View style={tw`rounded-2xl bg-[#0A173F] p-4`}>
                <Text style={tw`text-sm font-semibold text-white`}>
                  {payoutProfile.accountOwnershipType === "BUSINESS"
                    ? payoutProfile.businessName || "Business account"
                    : payoutProfile.legalName || "Personal account"}
                </Text>
                <Text style={tw`mt-2 text-sm text-[#B7C5E9]`}>
                  {payoutProfile.bankName || "-"} • {payoutProfile.accountNumberMasked || "-"}
                </Text>
                <Text style={tw`mt-1 text-sm text-[#8FA1CB]`}>
                  Account name: {payoutProfile.accountName || "Awaiting verification"}
                </Text>
                <Text style={tw`mt-1 text-sm text-[#8FA1CB]`}>
                  Verified: {formatDate(payoutProfile.accountVerifiedAt)}
                </Text>
                {payoutProfile.rejectionReason ? (
                  <Text style={tw`mt-3 text-sm text-[#FF9DB3]`}>
                    {payoutProfile.rejectionReason}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={tw`text-sm leading-6 text-[#9FB0D8]`}>
              Your first paid event created the wallet profile. Add a settlement account here so we know where to pay you when verification is complete.
            </Text>
          )}
        </SectionCard>

        <SectionCard
          title="Verification"
          subtitle="We verify the person or business behind the settlement account before we release earnings."
          actionText={payoutProfile?.bankName ? "Continue" : undefined}
          onPressAction={payoutProfile?.bankName ? openKycModal : undefined}
        >
          <View style={tw`flex-row flex-wrap gap-2`}>
            <StatusPill label={kyc?.status || onboarding?.kycStatus} />
            {currentOwnershipType === "BUSINESS" ? (
              <StatusPill label={kyc?.businessStatus} />
            ) : null}
            <StatusPill label={kyc?.identityStatus} />
            <StatusPill label={kyc?.livenessStatus} />
            <StatusPill label={kyc?.nameMatchStatus} />
          </View>

          <View style={tw`mt-4`}>{renderKycSteps(kyc)}</View>

          <View style={tw`mt-4 rounded-2xl bg-[#0A173F] p-4`}>
            <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
              Verified identity
            </Text>
            <Text style={tw`mt-2 text-sm font-semibold text-white`}>
              {kyc?.verifiedFullName || kyc?.verifiedBusinessName || "Not verified yet"}
            </Text>
            <Text style={tw`mt-2 text-sm text-[#9FB0D8]`}>
              {currentOwnershipType === "BUSINESS"
                ? "For business accounts, the submitted business name must match the bank account name before settlement is enabled."
                : "For personal accounts, the bank account name must match the verified identity before settlement is enabled."}
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title="ALAT transfer"
          subtitle="ALAT bank transfer becomes available to buyers only after your payout setup is active and our team activates your ALAT profile."
        >
          <View style={tw`flex-row items-start justify-between gap-3 rounded-2xl bg-[#0A173F] p-4`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-semibold text-white`}>
                {alatProfile?.displayName || "Awaiting ALAT activation"}
              </Text>
              <Text style={tw`mt-2 text-sm text-[#9FB0D8]`}>
                {alatProfile?.notes ||
                  "Once active, buyers will see your creator-branded ALAT transfer details during checkout."}
              </Text>
            </View>
            <StatusPill label={alatProfile?.status || onboarding?.alatProfileStatus} />
          </View>
        </SectionCard>

        <SectionCard
          title="Recent transactions"
          subtitle="These are the latest successful collections tied to your events."
        >
          {transactions.length ? (
            <View style={tw`gap-3`}>
              {transactions.map((transaction) => (
                <View
                  key={transaction.id}
                  style={tw`rounded-2xl border border-[#21315A] bg-[#0A173F] p-4`}
                >
                  <View style={tw`flex-row items-start justify-between gap-3`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-semibold text-white`}>
                        {transaction.eventTitle || toTitleCase(transaction.paymentType)}
                      </Text>
                      <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                        {toTitleCase(transaction.paymentType)} via {toTitleCase(transaction.paymentProvider)}
                      </Text>
                    </View>
                    <StatusPill label={transaction.settlementStatus} />
                  </View>

                  <View style={tw`mt-4 flex-row justify-between`}>
                    <View>
                      <Text style={tw`text-xs uppercase text-[#6F86B4]`}>Gross</Text>
                      <Text style={tw`mt-1 text-sm font-semibold text-white`}>
                        {formatMoney(transaction.grossAmount)}
                      </Text>
                    </View>
                    <View>
                      <Text style={tw`text-xs uppercase text-[#6F86B4]`}>Creator share</Text>
                      <Text style={tw`mt-1 text-sm font-semibold text-white`}>
                        {formatMoney(transaction.creatorPayable)}
                      </Text>
                    </View>
                  </View>

                  <Text style={tw`mt-3 text-xs text-[#8FA1CB]`}>
                    Buyer: {transaction.buyerUsername || "Unknown"} • {formatDate(transaction.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={tw`text-sm text-[#9FB0D8]`}>
              No transactions yet. Once buyers pay for your events, they’ll show up here.
            </Text>
          )}
        </SectionCard>

        <SectionCard
          title="Settlement history"
          subtitle="Completed and pending payout batches will appear here."
        >
          {settlements.length ? (
            <View style={tw`gap-3`}>
              {settlements.map((settlement) => (
                <View
                  key={settlement.id}
                  style={tw`rounded-2xl border border-[#21315A] bg-[#0A173F] p-4`}
                >
                  <View style={tw`flex-row items-start justify-between gap-3`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-semibold text-white`}>
                        {formatMoney(settlement.amount)}
                      </Text>
                      <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                        {settlement.reference} • {settlement.transactionCount} transactions
                      </Text>
                    </View>
                    <StatusPill label={settlement.status} />
                  </View>

                  <Text style={tw`mt-3 text-sm text-[#9FB0D8]`}>
                    {settlement.destinationBankName || "Bank"} • {settlement.destinationAccountNumber || "-"}
                  </Text>
                  <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                    Created {formatDate(settlement.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={tw`text-sm text-[#9FB0D8]`}>
              No settlements yet. Verified creators will see payout batches here once funds are released.
            </Text>
          )}
        </SectionCard>
      </ScrollView>

      <Modal visible={payoutModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={tw`flex-1 justify-end bg-black/55`}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={tw`max-h-[88%] rounded-t-[32px] bg-[#041130] px-5 pb-8 pt-5`}>
            <View style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-[#2B3C66]`} />
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-xl font-semibold text-white`}>Settlement account</Text>
              <TouchableOpacity onPress={() => setPayoutModalVisible(false)}>
                <Text style={tw`text-sm font-semibold text-[#9FB0D8]`}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pt-4 pb-6`}>
              <Text style={tw`text-sm leading-5 text-[#9FB0D8]`}>
                The account name here must match the identity or business documents you use for verification.
              </Text>

              <View style={tw`mt-5 rounded-2xl bg-[#0A173F] px-3 py-1`}>
                <Picker
                  selectedValue={currentOwnershipType}
                  onValueChange={(value) => setOwnershipType(value)}
                  dropdownIconColor="#FFFFFF"
                  style={{ color: "white" }}
                >
                  <Picker.Item label="Personal account" value="PERSONAL" />
                  <Picker.Item label="Business account" value="BUSINESS" />
                </Picker>
              </View>

              {currentOwnershipType === "PERSONAL" ? (
                <>
                  <TextInput
                    value={legalName}
                    onChangeText={setLegalName}
                    placeholder="Legal name"
                    placeholderTextColor="#6F86B4"
                    style={tw`mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white`}
                  />
                  <TextInput
                    value={bvnLast4}
                    onChangeText={setBvnLast4}
                    placeholder="BVN last 4 digits (optional)"
                    placeholderTextColor="#6F86B4"
                    keyboardType="number-pad"
                    maxLength={4}
                    style={tw`mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white`}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Registered business name"
                    placeholderTextColor="#6F86B4"
                    style={tw`mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white`}
                  />
                  <TextInput
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="Business account name (optional)"
                    placeholderTextColor="#6F86B4"
                    style={tw`mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white`}
                  />
                </>
              )}

              <TouchableOpacity
                onPress={openBankSearchModal}
                style={tw`mt-4 rounded-2xl bg-[#0A173F] px-4 py-4`}
              >
                <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
                  Settlement bank
                </Text>
                <Text style={tw`mt-2 text-base font-semibold text-white`}>
                  {selectedBank?.name || "Search and select a bank"}
                </Text>
                <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                  {selectedBank?.code
                    ? `Code ${selectedBank.code}`
                    : "Tap to search by bank name or code"}
                </Text>
              </TouchableOpacity>

              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Account number"
                placeholderTextColor="#6F86B4"
                keyboardType="number-pad"
                style={tw`mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white`}
              />

              <View style={tw`mt-4 rounded-2xl border border-[#24345A] bg-[#08153C] p-4`}>
                <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
                  What happens next
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#B7C5E9]`}>
                  {currentOwnershipType === "BUSINESS"
                    ? "We’ll save the account for business review, then compare it against your CAC verification details."
                    : "We’ll verify the account name against the bank response, then use that during your personal KYC review."}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSavePayoutProfile}
                disabled={busy}
                style={tw.style(
                  "mt-6 flex-row items-center justify-center rounded-full bg-[#0FF1CF] px-4 py-4",
                  busy && "opacity-60"
                )}
              >
                {payoutMutation.isPending ? (
                  <ActivityIndicator color="#03122F" />
                ) : (
                  <Text style={tw`text-sm font-semibold text-[#03122F]`}>
                    Save settlement account
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={bankSearchModalVisible} animationType="fade" transparent>
        <View style={tw`flex-1 justify-center bg-black/65 px-5`}>
          <View style={tw`max-h-[75%] rounded-[28px] border border-[#24345A] bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-lg font-semibold text-white`}>Choose bank</Text>
              <TouchableOpacity onPress={closeBankSearchModal}>
                <Text style={tw`text-sm font-semibold text-[#9FB0D8]`}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={bankSearchQuery}
              onChangeText={setBankSearchQuery}
              placeholder="Search bank name or code"
              placeholderTextColor="#6F86B4"
              autoCapitalize="none"
              autoCorrect={false}
              style={tw`mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white`}
            />

            <Text style={tw`mt-3 text-xs text-[#8FA1CB]`}>
              {bankSearchQuery.trim()
                ? `${filteredBanks.length} bank${filteredBanks.length === 1 ? "" : "s"} found`
                : selectedBank?.name
                  ? `Current selection: ${selectedBank.name}. Start typing to search the full list.`
                  : "Showing a short bank list for speed. Start typing to search the full list."}
            </Text>

            {banksQuery.isLoading ? (
              <View style={tw`items-center justify-center py-10`}>
                <ActivityIndicator tone="accent" />
                <Text style={tw`mt-3 text-sm text-[#9FB0D8]`}>
                  Loading banks...
                </Text>
              </View>
            ) : visibleBanks.length ? (
              <FlatList
                data={visibleBanks}
                keyExtractor={(bank) => `${bank.code || bank.name}`}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                initialNumToRender={12}
                maxToRenderPerBatch={16}
                windowSize={8}
                contentContainerStyle={tw`pt-4 pb-2`}
                renderItem={({ item: bank }) => {
                  const isSelected = bank.code === selectedBankCode;

                  return (
                    <TouchableOpacity
                      onPress={() => handleSelectBank(bank)}
                      style={tw.style(
                        "mb-3 rounded-2xl border px-4 py-4",
                        isSelected
                          ? "border-[#0FF1CF] bg-[#0A1D43]"
                          : "border-[#21315A] bg-[#0A173F]"
                      )}
                    >
                      <Text style={tw`text-sm font-semibold text-white`}>
                        {bank.name || "Unknown bank"}
                      </Text>
                      <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                        {bank.code
                          ? `Code ${bank.code}${bank.longcode ? ` • ${bank.longcode}` : ""}`
                          : "Bank code unavailable"}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={tw`items-center justify-center py-10`}>
                <Text style={tw`text-sm text-[#9FB0D8]`}>
                  No bank matches “{bankSearchQuery.trim()}”.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={kycModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={tw`flex-1 justify-end bg-black/55`}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={tw`max-h-[90%] rounded-t-[32px] bg-[#041130] px-5 pb-8 pt-5`}>
            <View style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-[#2B3C66]`} />
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-xl font-semibold text-white`}>Verification</Text>
              <TouchableOpacity
                onPress={() => void handleCloseKycModal()}
                disabled={notifyOnKycResolutionMutation.isPending}
              >
                <Text
                  style={tw.style(
                    "text-sm font-semibold text-[#9FB0D8]",
                    notifyOnKycResolutionMutation.isPending && "opacity-60"
                  )}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pt-4 pb-6`}>
              <View style={tw`mb-4 flex-row flex-wrap gap-2`}>
                <StatusPill label={kyc?.status || onboarding?.kycStatus} />
                {currentOwnershipType === "BUSINESS" ? (
                  <StatusPill label={kyc?.businessStatus} />
                ) : null}
                <StatusPill label={kyc?.identityStatus} />
                <StatusPill label={kyc?.livenessStatus} />
                <StatusPill label={kyc?.nameMatchStatus} />
              </View>

              <View style={tw`rounded-2xl border border-[#24345A] bg-[#08153C] p-4`}>
                <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
                  Verification path
                </Text>
                <Text style={tw`mt-2 text-base font-semibold text-white`}>
                  {currentOwnershipType === "BUSINESS" ? "Business KYC" : "Personal KYC"}
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#B7C5E9]`}>
                  {currentOwnershipType === "BUSINESS"
                    ? "We’ll verify the CAC record, verify the representative behind the business, run face match, then compare the verified business name to the settlement account you added."
                    : "Choose the identity document you want to use, verify it, run face match, then compare the verified identity to the payout account name."}
                </Text>
              </View>

              {pendingProviderState ? (
                <View style={tw`mt-4 rounded-2xl border border-[#67511A] bg-[#2A2209] p-4`}>
                  <Text style={tw`text-xs uppercase tracking-wide text-[#FFD76A]`}>
                    Verification in progress
                  </Text>
                  <Text style={tw`mt-2 text-base font-semibold text-white`}>
                    {pendingProviderState.title}
                  </Text>
                  <Text style={tw`mt-2 text-sm leading-5 text-[#F4E7B0]`}>
                    {pendingProviderState.description}
                  </Text>
                  {!pendingProviderTimedOut ? (
                    <Text style={tw`mt-3 text-sm text-[#F4E7B0]`}>
                      We’ll keep checking automatically for the next {pendingProviderCountdown}s.
                    </Text>
                  ) : (
                    <Text style={tw`mt-3 text-sm text-[#F4E7B0]`}>
                      We’re still waiting on the provider. You can keep waiting here or continue later without losing your request.
                    </Text>
                  )}
                  <View style={tw`mt-4 flex-row gap-3`}>
                    <TouchableOpacity
                      onPress={() => {
                        setPendingProviderCountdown(45);
                        void syncPendingProviderStatus();
                      }}
                      disabled={notifyOnKycResolutionMutation.isPending}
                      style={tw`flex-1 rounded-full border border-[#D2B04C] px-4 py-3`}
                    >
                      <Text style={tw`text-center text-sm font-semibold text-[#FFF3C6]`}>
                        {pendingProviderTimedOut ? "Keep waiting" : "Refresh now"}
                      </Text>
                    </TouchableOpacity>
                    {pendingProviderTimedOut ? (
                      <TouchableOpacity
                        onPress={handleContinueLater}
                        disabled={notifyOnKycResolutionMutation.isPending}
                        style={tw.style(
                          "flex-1 rounded-full bg-[#FFF3C6] px-4 py-3",
                          notifyOnKycResolutionMutation.isPending && "opacity-60"
                        )}
                      >
                        {notifyOnKycResolutionMutation.isPending ? (
                          <ActivityIndicator color="#2A2209" />
                        ) : (
                          <Text style={tw`text-center text-sm font-semibold text-[#2A2209]`}>
                            Continue later
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {currentOwnershipType === "BUSINESS" ? (
                <>
                  <StepCard
                    stepLabel="Step 1"
                    title="Verify the business record"
                    description="Start with the CAC record. Once that passes, we’ll unlock the representative step."
                    collapsed={isBusinessVerificationVerified}
                    summary="CAC verification is complete. You can continue with the representative step."
                  >
                    <TextInput
                      value={businessRegNumber}
                      onChangeText={setBusinessRegNumber}
                      editable={!isBusinessVerificationVerified}
                      placeholder="CAC registration number"
                      placeholderTextColor="#6F86B4"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isBusinessVerificationVerified && "opacity-60"
                      )}
                    />
                    <TextInput
                      value={businessDisplayName}
                      onChangeText={setBusinessDisplayName}
                      editable={!isBusinessVerificationVerified}
                      placeholder="Business name (optional)"
                      placeholderTextColor="#6F86B4"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isBusinessVerificationVerified && "opacity-60"
                      )}
                    />
                    <Text style={tw`mt-3 text-xs text-[#8FA1CB]`}>
                      {kyc?.businessStatus === "PENDING_PROVIDER"
                        ? "We’ve sent the CAC request to QoreID and we’re waiting for the provider to respond."
                        : kyc?.businessStatus === "VERIFIED"
                          ? "CAC verification is complete. This step is locked while you continue with the representative."
                          : isBusinessVerificationRejected
                            ? "The CAC step needs attention before you can continue."
                          : "This step must complete before representative verification can start."}
                    </Text>
                    <TouchableOpacity
                      onPress={handleStartBusinessKyc}
                      disabled={busy || isBusinessVerificationVerified}
                      style={tw.style(
                        "mt-5 rounded-full bg-[#0FF1CF] px-4 py-4",
                        (busy || isBusinessVerificationVerified) && "opacity-60"
                      )}
                    >
                      {startBusinessKycMutation.isPending ? (
                        <ActivityIndicator color="#03122F" />
                      ) : (
                        <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                          {isBusinessVerificationVerified ? "CAC record verified" : "Verify CAC record"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </StepCard>

                  <StepCard
                    stepLabel="Step 2"
                    title="Verify the representative"
                    description={
                      canStartBusinessRepresentative
                        ? "Now verify the person behind the business."
                        : isBusinessVerificationPending
                          ? "No action is needed here yet. We’ll unlock this as soon as the CAC provider responds."
                          : "Finish the CAC step first, then come back here for the representative."
                    }
                    collapsed={isIdentityVerified}
                    summary="Representative verification is complete. Face match is ready next."
                  >
                    <View
                      style={tw.style(
                        !canStartBusinessRepresentative && "opacity-70"
                      )}
                    >
                    <View style={tw`mt-4 rounded-2xl bg-[#0A173F] px-3 py-1`}>
                      <Picker
                        selectedValue={currentBusinessVerificationMode}
                        enabled={!isIdentityVerified}
                        onValueChange={(value) =>
                          setRepresentativeVerificationMode(
                            normalizeBusinessVerificationMode(value as KycVerificationMode)
                          )
                        }
                        dropdownIconColor="#FFFFFF"
                        style={{ color: "white" }}
                      >
                        <Picker.Item label="Representative NIN" value="BUSINESS_CAC_REP_NIN" />
                        <Picker.Item label="Representative vNIN" value="BUSINESS_CAC_REP_VNIN" />
                        <Picker.Item label="Representative passport" value="BUSINESS_CAC_REP_PASSPORT" />
                      </Picker>
                    </View>
                    <TextInput
                      value={representativeFirstName}
                      onChangeText={setRepresentativeFirstName}
                      editable={!isIdentityVerified}
                      placeholder="Representative first name"
                      placeholderTextColor="#6F86B4"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isIdentityVerified && "opacity-60"
                      )}
                    />
                    <TextInput
                      value={representativeLastName}
                      onChangeText={setRepresentativeLastName}
                      editable={!isIdentityVerified}
                      placeholder="Representative last name"
                      placeholderTextColor="#6F86B4"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isIdentityVerified && "opacity-60"
                      )}
                    />
                    <TextInput
                      value={representativePhone}
                      onChangeText={setRepresentativePhone}
                      editable={!isIdentityVerified}
                      placeholder="Representative phone number"
                      placeholderTextColor="#6F86B4"
                      keyboardType="phone-pad"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isIdentityVerified && "opacity-60"
                      )}
                    />
                    <TextInput
                      value={representativeDob}
                      onChangeText={setRepresentativeDob}
                      editable={!isIdentityVerified}
                      placeholder="Representative date of birth (YYYY-MM-DD)"
                      placeholderTextColor="#6F86B4"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isIdentityVerified && "opacity-60"
                      )}
                    />
                    {currentBusinessVerificationMode === "BUSINESS_CAC_REP_NIN" ? (
                      <TextInput
                        value={representativeNin}
                        onChangeText={setRepresentativeNin}
                        editable={!isIdentityVerified}
                        placeholder="Representative NIN"
                        placeholderTextColor="#6F86B4"
                        keyboardType="number-pad"
                        style={tw.style(
                          "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                          isIdentityVerified && "opacity-60"
                        )}
                      />
                    ) : null}
                    {currentBusinessVerificationMode === "BUSINESS_CAC_REP_VNIN" ? (
                      <TextInput
                        value={representativeVnin}
                        onChangeText={setRepresentativeVnin}
                        editable={!isIdentityVerified}
                        placeholder="Representative vNIN"
                        placeholderTextColor="#6F86B4"
                        style={tw.style(
                          "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                          isIdentityVerified && "opacity-60"
                        )}
                      />
                    ) : null}
                    {currentBusinessVerificationMode === "BUSINESS_CAC_REP_PASSPORT" ? (
                      <TextInput
                        value={representativePassportNumber}
                        onChangeText={setRepresentativePassportNumber}
                        editable={!isIdentityVerified}
                        placeholder="Representative passport number"
                        placeholderTextColor="#6F86B4"
                        autoCapitalize="characters"
                        style={tw.style(
                          "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                          isIdentityVerified && "opacity-60"
                        )}
                      />
                    ) : null}
                    <Text style={tw`mt-3 text-xs text-[#8FA1CB]`}>
                      {kyc?.identityStatus === "PENDING_PROVIDER"
                        ? "Representative verification is in progress with QoreID."
                        : isIdentityVerified
                          ? "Representative verification is complete. This step is locked while you continue to face match."
                          : isIdentityRejected
                            ? "Representative verification needs attention before face match can continue."
                            : "This step unlocks face match."}
                    </Text>
                    <TouchableOpacity
                      onPress={handleStartBusinessRepresentativeKyc}
                      disabled={busy || !canStartBusinessRepresentative || isIdentityVerified}
                      style={tw.style(
                        "mt-5 rounded-full bg-[#0FF1CF] px-4 py-4",
                        (busy || !canStartBusinessRepresentative || isIdentityVerified) && "opacity-60"
                      )}
                    >
                      {startBusinessRepresentativeKycMutation.isPending ? (
                        <ActivityIndicator color="#03122F" />
                      ) : (
                        <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                          {isIdentityVerified
                            ? "Representative verified"
                            : "Verify representative identity"}
                        </Text>
                      )}
                    </TouchableOpacity>
                    </View>
                  </StepCard>
                </>
              ) : (
                <StepCard
                  stepLabel="Step 1"
                  title="Verify your identity"
                  description={
                    isIdentityRejected
                      ? "This step needs attention before you can continue."
                      : "Choose your document, submit the matching details, and we’ll verify it before unlocking face match."
                  }
                  collapsed={isIdentityVerified}
                  summary="Identity verified. Face match is ready next."
                >
                  <View style={tw`mt-4 rounded-2xl bg-[#0A173F] px-3 py-1`}>
                    <Picker
                      selectedValue={currentPersonalVerificationMode}
                      enabled={!isIdentityVerified}
                      onValueChange={(value) =>
                        setPersonalVerificationMode(
                          normalizePersonalVerificationMode(value as KycVerificationMode)
                        )
                      }
                      dropdownIconColor="#FFFFFF"
                      style={{ color: "white" }}
                    >
                      <Picker.Item label="NIN" value="PERSONAL_NIN" />
                      <Picker.Item label="vNIN" value="PERSONAL_VNIN" />
                      <Picker.Item label="Passport" value="PERSONAL_PASSPORT" />
                    </Picker>
                  </View>
                  <TextInput
                    value={personalFirstName}
                    onChangeText={setPersonalFirstName}
                    editable={!isIdentityVerified}
                    placeholder="First name"
                    placeholderTextColor="#6F86B4"
                    style={tw.style(
                      "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                      isIdentityVerified && "opacity-60"
                    )}
                  />
                  <TextInput
                    value={personalLastName}
                    onChangeText={setPersonalLastName}
                    editable={!isIdentityVerified}
                    placeholder="Last name"
                    placeholderTextColor="#6F86B4"
                    style={tw.style(
                      "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                      isIdentityVerified && "opacity-60"
                    )}
                  />
                  <TextInput
                    value={personalPhoneNumber}
                    onChangeText={setPersonalPhoneNumber}
                    editable={!isIdentityVerified}
                    placeholder="Phone number"
                    placeholderTextColor="#6F86B4"
                    keyboardType="phone-pad"
                    style={tw.style(
                      "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                      isIdentityVerified && "opacity-60"
                    )}
                  />
                  {currentPersonalVerificationMode === "PERSONAL_NIN" ? (
                    <TextInput
                      value={personalNin}
                      onChangeText={setPersonalNin}
                      editable={!isIdentityVerified}
                      placeholder="NIN"
                      placeholderTextColor="#6F86B4"
                      keyboardType="number-pad"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isIdentityVerified && "opacity-60"
                      )}
                    />
                  ) : null}
                  {currentPersonalVerificationMode === "PERSONAL_VNIN" ? (
                    <TextInput
                      value={personalVnin}
                      onChangeText={setPersonalVnin}
                      editable={!isIdentityVerified}
                      placeholder="vNIN"
                      placeholderTextColor="#6F86B4"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isIdentityVerified && "opacity-60"
                      )}
                    />
                  ) : null}
                  {currentPersonalVerificationMode === "PERSONAL_PASSPORT" ? (
                    <TextInput
                      value={personalPassportNumber}
                      onChangeText={setPersonalPassportNumber}
                      editable={!isIdentityVerified}
                      placeholder="Passport number"
                      placeholderTextColor="#6F86B4"
                      autoCapitalize="characters"
                      style={tw.style(
                        "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                        isIdentityVerified && "opacity-60"
                      )}
                    />
                  ) : null}
                  <TextInput
                    value={personalDob}
                    onChangeText={setPersonalDob}
                    editable={!isIdentityVerified}
                    placeholder="Date of birth (YYYY-MM-DD)"
                    placeholderTextColor="#6F86B4"
                    style={tw.style(
                      "mt-4 rounded-2xl bg-[#0A173F] px-4 py-4 text-white",
                      isIdentityVerified && "opacity-60"
                    )}
                  />
                  <TouchableOpacity
                    onPress={handleStartPersonalKyc}
                    disabled={busy || isIdentityVerified}
                    style={tw.style(
                      "mt-5 rounded-full bg-[#0FF1CF] px-4 py-4",
                      (busy || isIdentityVerified) && "opacity-60"
                    )}
                  >
                    {startPersonalKycMutation.isPending ? (
                      <ActivityIndicator color="#03122F" />
                    ) : (
                      <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                        {isIdentityVerified ? "Identity verified" : "Verify personal identity"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </StepCard>
              )}

              <StepCard
                stepLabel={currentOwnershipType === "BUSINESS" ? "Step 3" : "Step 2"}
                title="Selfie submission"
                description={
                  canSubmitLiveness
                    ? "Pick a clear selfie image. We send it to QoreID for face match against the identity document you selected earlier."
                    : currentOwnershipType === "BUSINESS"
                      ? "Face match unlocks after CAC and representative identity verification are complete."
                      : "Face match unlocks after your identity verification is complete."
                }
                collapsed={isLivenessVerified}
                summary="Face match is complete. Your profile is ready for final review."
              >
                <View style={tw`mt-3 flex-row items-start gap-3`}>
                  <View style={tw`rounded-2xl bg-[#12234D] p-3`}>
                    <Camera size={18} color="#FFD76A" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-semibold text-white`}>Face match</Text>
                    <Text style={tw`mt-1 text-sm leading-5 text-[#9FB0D8]`}>
                      We compare your selfie with the identity details you already verified.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={pickSelfie}
                  disabled={isLivenessVerified}
                  style={tw.style(
                    "mt-4 rounded-full border border-[#30446F] px-4 py-3",
                    isLivenessVerified && "opacity-50"
                  )}
                >
                  <Text style={tw`text-center text-sm font-semibold text-white`}>
                    {isLivenessVerified
                      ? "Face match completed"
                      : selectedSelfie
                        ? "Replace selfie image"
                        : "Choose selfie image"}
                  </Text>
                </TouchableOpacity>

                {selectedSelfie ? (
                  <Text style={tw`mt-3 text-xs text-[#8FA1CB]`} numberOfLines={1}>
                    Selected: {selectedSelfie.uri}
                  </Text>
                ) : null}

                <View style={tw`mt-3 rounded-2xl border border-[#24345A] bg-[#071236] p-3`}>
                  <Text style={tw`text-xs uppercase tracking-wide text-[#8FA1CB]`}>
                    Identity number for face match
                  </Text>
                  <Text style={tw`mt-2 text-sm text-white`}>
                    {currentOwnershipType === "BUSINESS"
                      ? representativeIdentityNumber || "Add the representative's identity number above first."
                      : personalIdentityNumber || "Add your identity number above first."}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleSubmitLiveness}
                  disabled={busy || !selectedSelfie || !canSubmitLiveness || isLivenessVerified}
                  style={tw.style(
                    "mt-4 rounded-full bg-[#FFD76A] px-4 py-3",
                    (busy || !selectedSelfie || !canSubmitLiveness || isLivenessVerified) && "opacity-50"
                  )}
                >
                  {submitLivenessMutation.isPending ? (
                    <ActivityIndicator color="#03122F" />
                  ) : (
                    <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                      {isLivenessVerified ? "Face match verified" : "Submit face match"}
                    </Text>
                  )}
                </TouchableOpacity>
              </StepCard>

              <StepCard
                stepLabel={currentOwnershipType === "BUSINESS" ? "Step 4" : "Step 3"}
                title="Ready for review?"
                description="Once your identity check and selfie are in, you can send everything for review. We’ll keep collections running while settlement remains on hold."
                collapsed={isKycSubmitted}
                summary={
                  kyc?.status === "VERIFIED"
                    ? "KYC is verified. Your payout profile is fully approved."
                    : "KYC has been submitted. We’ll review it and update your payout status."
                }
              >

                <TouchableOpacity
                  onPress={handleSubmitKyc}
                  disabled={busy || !canSubmitKyc || isKycSubmitted}
                  style={tw.style(
                    "mt-4 rounded-full bg-white px-4 py-3",
                    (busy || !canSubmitKyc || isKycSubmitted) && "opacity-50"
                  )}
                >
                  {submitKycMutation.isPending ? (
                    <ActivityIndicator color="#03122F" />
                  ) : (
                    <Text style={tw`text-center text-sm font-semibold text-[#03122F]`}>
                      {kyc?.status === "VERIFIED"
                        ? "KYC verified"
                        : isKycSubmitted
                          ? "KYC submitted"
                          : "Submit KYC for review"}
                    </Text>
                  )}
                </TouchableOpacity>
              </StepCard>

              {kyc?.rejectionReason ? (
                <View style={tw`mt-4 flex-row items-start gap-3 rounded-2xl bg-[#32101D] p-4`}>
                  <BadgeAlert size={18} color="#FF9DB3" />
                  <Text style={tw`flex-1 text-sm leading-5 text-[#FFB9C9]`}>
                    {kyc.rejectionReason}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default WalletScreen;
