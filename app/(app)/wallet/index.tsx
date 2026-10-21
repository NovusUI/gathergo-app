import AppRefreshControl, {
  RefreshIndicator,
} from "@/components/ui/AppRefreshControl";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import ActivityIndicator from "@/components/ui/AppLoader";
import AppToast from "@/components/ui/AppToast";
import { GatherGoMascot } from "@/components/ui/GatherGoMascot";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { MascotMoment } from "@/components/ui/MascotMoment";
import { useAuth } from "@/context/AuthContext";
import type { GatherGoMascotVariant } from "@/constants/mascot";
import {
  useResolveWalletPayoutAccount,
  useStartBusinessKyc,
  useStartBusinessRepresentativeKyc,
  useStartPersonalKyc,
  useSubmitWalletLiveness,
  useUpsertWalletPayoutProfile
} from "@/services/mutations";
import {
  useWalletBanks,
  useWalletKyc,
  useWalletOnboarding,
  useWalletOverview,
  useWalletSettlements,
  useWalletTransactions
} from "@/services/queries";
import {
  AccountOwnershipType,
  KycVerificationMode,
  WalletBank,
  WalletKycData,
  WalletKycStep,
  WalletOnboardingData,
  WalletPayoutAccountResolution,
  WalletKycResponse,
  WalletSettlement,
  WalletTransaction
} from "@/types/wallet";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning
} from "@/utils/globalErrorHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Loader,
  Wallet as WalletIcon,
  X
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import tw, { style as twStyle } from "twrnc";

const WALLET_PREVIEW_LIMIT = 5;
const WALLET_HISTORY_PAGE_SIZE = 20;

type WalletHistoryView = "transactions" | "settlements" | null;

const formatMoney = (amount?: number | null) => {
  const value = Number(amount || 0);
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const getKycProgressMessage = (kyc: WalletKycData, defaultMessage: string) => {
  if (
    kyc.status === "REJECTED" ||
    kyc.businessStatus === "REJECTED" ||
    kyc.identityStatus === "REJECTED" ||
    kyc.livenessStatus === "REJECTED" ||
    kyc.nameMatchStatus === "MISMATCH"
  ) {
    return "KYC needs review. Check the details below.";
  }

  if (kyc.status === "SUBMITTED" || kyc.nameMatchStatus === "REVIEW_REQUIRED") {
    return "KYC sent for review.";
  }

  if (kyc.status === "VERIFIED" && kyc.kycTier === "FULL") {
    return "Full KYC active.";
  }

  if (kyc.status === "VERIFIED" && kyc.kycTier === "BASIC") {
    return "Basic KYC active.";
  }

  return defaultMessage;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
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

const hasWalletItemId = <T extends { id?: string | null }>(
  item: T | null | undefined
): item is T & { id: string } => Boolean(item?.id);

const getHistoryPageItems = <T extends { id?: string | null }>(
  payload: T[] | { data?: T[] } | null | undefined
) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
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

  if (
    /dikript|qoreid|access token|credentials are not configured|bad gateway/i.test(
      rawMessage
    )
  ) {
    return fallback;
  }

  return rawMessage || fallback;
};

const splitFullName = (value?: string | null) => {
  const parts = (value || "").trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ")
  };
};

const normalizePayoutAccountNumber = (value?: string | null) =>
  (value || "").replace(/\s+/g, "").trim();

const buildPayoutResolutionKey = (
  bankCode?: string | null,
  accountNumber?: string | null
) => `${bankCode || ""}:${normalizePayoutAccountNumber(accountNumber)}`;

const BUSINESS_ACCOUNT_NAME_PATTERN = /\b(?:ltd|limited)\b/i;

const getOwnershipTypeFromResolvedAccountName = (
  accountName: string | null | undefined,
  selectedOwnershipType: AccountOwnershipType
): AccountOwnershipType =>
  BUSINESS_ACCOUNT_NAME_PATTERN.test(accountName || "")
    ? "BUSINESS"
    : selectedOwnershipType;

const normalizePersonalVerificationMode = (
  mode?: KycVerificationMode | null
): KycVerificationMode => {
  switch (mode) {
    case "PERSONAL_BVN":
    case "PERSONAL_PHONE":
    case "PERSONAL_NIN":
      return mode;
    case "PERSONAL_PHONE_NIN":
      return "PERSONAL_PHONE";
    default:
      return "PERSONAL_NIN";
  }
};

const normalizeBusinessVerificationMode = (
  mode?: KycVerificationMode | null
): KycVerificationMode => {
  switch (mode) {
    case "BUSINESS_CAC_REP_BVN":
    case "BUSINESS_CAC_REP_PHONE":
    case "BUSINESS_CAC_REP_NIN":
      return mode;
    case "BUSINESS_CAC_REP_PHONE_NIN":
      return "BUSINESS_CAC_REP_PHONE";
    default:
      return "BUSINESS_CAC_REP_NIN";
  }
};

const getStatusTone = (status?: string | null) => {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
    case "VERIFIED":
    case "MATCHED":
    case "SUCCESS":
    case "CLEAR":
      return {
        bg: "#0F3A32",
        text: "#65F5C7"
      };
    case "PENDING_KYC":
    case "IN_PROGRESS":
    case "PENDING_PROVIDER":
    case "SUBMITTED":
    case "PENDING_REVIEW":
    case "PROCESSING":
    case "READY":
    case "HELD_KYC":
    case "REVIEW":
      return {
        bg: "#3A300F",
        text: "#FFD76A"
      };
    case "REJECTED":
    case "FAILED":
    case "MISMATCH":
    case "RESTRICTED":
    case "HELD_RISK":
    case "HOLD":
    case "BLOCKED":
    case "CANCELLED":
      return {
        bg: "#3E1822",
        text: "#FF8FA9"
      };
    default:
      return {
        bg: "#1E2A4C",
        text: "#C9D4FF"
      };
  }
};

const getTaskCopy = (onboarding?: WalletOnboardingData | null) => {
  if (onboarding?.kycStatus === "PENDING_PROVIDER") {
    return {
      title: "Verification in progress",
      subtitle: "Collections continue while checks finish.",
      action: "View setup"
    };
  }

  switch (onboarding?.nextAction) {
    case "ADD_SETTLEMENT_ACCOUNT":
      return {
        title: "Payout account needed",
        subtitle: "Add where creator payouts should land.",
        action: "Add account"
      };
    case "COMPLETE_KYC":
      return {
        title: "Identity verification needed",
        subtitle: "Finish the next check to release earnings.",
        action: "Continue KYC"
      };
    case "ALAT_ACTIVATION":
      return {
        title: "Wallet setup under review",
        subtitle: "Settlement access is being reviewed.",
        action: "View setup"
      };
    default:
      return {
        title: "Your wallet is in good shape",
        subtitle: "Payouts and settlement history live here.",
        action: "Manage setup"
      };
  }
};

type WalletMascotMomentCopy = {
  variant: GatherGoMascotVariant;
  title: string;
  message: string;
};

const getWalletMascotVariant = (
  onboarding?: WalletOnboardingData | null
): GatherGoMascotVariant => {
  if (onboarding?.kycStatus === "PENDING_PROVIDER") {
    return "pending";
  }

  if (
    onboarding?.nextAction === "ADD_SETTLEMENT_ACCOUNT" ||
    onboarding?.nextAction === "COMPLETE_KYC" ||
    onboarding?.nextAction === "ALAT_ACTIVATION"
  ) {
    return "pending";
  }

  return onboarding?.canReceiveSettlement ? "verified" : "idle";
};

const isWalletSetupIncomplete = (
  onboarding?: WalletOnboardingData | null
) => {
  if (!onboarding) return false;

  const kycIsReady =
    onboarding.kycStatus === "VERIFIED" &&
    (onboarding.kycTier === "FULL" ||
      (onboarding.kycTier === "BASIC" && !onboarding.livenessRequired));

  return (
    onboarding.needsAttention ||
    Boolean(onboarding.nextAction) ||
    !onboarding.canReceiveSettlement ||
    !kycIsReady
  );
};

const getSetupMascotMoment = ({
  activeSetupStep,
  setupLoading,
  kyc,
  onboarding,
  resolvePayoutAccountPending,
  hasResolvedPayoutAccount,
  resolvedPayoutAccount,
  payoutResolutionError,
  selectedSelfie
}: {
  activeSetupStep: string;
  setupLoading: boolean;
  kyc?: WalletKycData;
  onboarding?: WalletOnboardingData | null;
  resolvePayoutAccountPending: boolean;
  hasResolvedPayoutAccount: boolean;
  resolvedPayoutAccount?: WalletPayoutAccountResolution | null;
  payoutResolutionError: string;
  selectedSelfie: boolean;
}): WalletMascotMomentCopy => {
  if (setupLoading) {
    return {
      variant: "pending",
      title: "Checking setup",
      message: "I am checking what is already done."
    };
  }

  const hasRejectedCheck =
    kyc?.status === "REJECTED" ||
    kyc?.businessStatus === "REJECTED" ||
    kyc?.identityStatus === "REJECTED" ||
    kyc?.livenessStatus === "REJECTED" ||
    kyc?.nameMatchStatus === "MISMATCH";

  if (hasRejectedCheck) {
    return {
      variant: "error",
      title: "Needs attention",
      message: "Something needs another look. Check the active step below."
    };
  }

  switch (activeSetupStep) {
    case "PAYOUT_ACCOUNT":
      if (resolvePayoutAccountPending) {
        return {
          variant: "pending",
          title: "Checking account",
          message: "I am pulling the account name now."
        };
      }

      if (hasResolvedPayoutAccount && resolvedPayoutAccount?.accountName) {
        return {
          variant: "verified",
          title: "Name found",
          message: "I found the account name. Save it and I will move you on."
        };
      }

      if (payoutResolutionError) {
        return {
          variant: "error",
          title: "Not resolved",
          message: "Check the bank or account number, then try again."
        };
      }

      return {
        variant: "idle",
        title: "Payout account",
        message: "Choose a bank and enter the 10 digit account number."
      };

    case "PERSONAL_IDENTITY":
      if (kyc?.identityStatus === "PENDING_PROVIDER") {
        return {
          variant: "pending",
          title: "Identity check",
          message: "I will update this once the provider responds."
        };
      }

      if (kyc?.identityStatus === "VERIFIED") {
        return {
          variant: "verified",
          title: "Identity clear",
          message: "Your personal identity check is complete."
        };
      }

      return {
        variant: "idle",
        title: "Identity check",
        message: "Pick one method and enter the matching details."
      };

    case "BUSINESS_IDENTITY":
      if (kyc?.businessStatus === "PENDING_PROVIDER") {
        return {
          variant: "pending",
          title: "Checking CAC",
          message: "I will update this once CAC responds."
        };
      }

      if (kyc?.businessStatus === "VERIFIED") {
        return {
          variant: "verified",
          title: "Business clear",
          message: "CAC is verified. Keep going when needed."
        };
      }

      return {
        variant: "idle",
        title: "Business check",
        message: "Add the CAC number. I will use the payout name we found."
      };

    case "NAME_MATCH":
    case "BUSINESS_NAME_MATCH":
      if (kyc?.nameMatchStatus === "REVIEW_REQUIRED") {
        return {
          variant: "pending",
          title: "Review queued",
          message: "The names are close enough for the team to review."
        };
      }

      return {
        variant: "error",
        title: "Name mismatch",
        message: "Compare both names below, then retry the step that changed."
      };

    case "REPRESENTATIVE_IDENTITY":
      if (kyc?.identityStatus === "PENDING_PROVIDER") {
        return {
          variant: "pending",
          title: "Rep check",
          message: "Representative verification is running."
        };
      }

      if (kyc?.identityStatus === "VERIFIED") {
        return {
          variant: "verified",
          title: "Rep clear",
          message: "Representative identity is verified."
        };
      }

      return {
        variant: "idle",
        title: "Rep identity",
        message: "CAC is clear. Add the representative details below."
      };

    case "LIVENESS":
      if (kyc?.livenessStatus === "PENDING_PROVIDER") {
        return {
          variant: "pending",
          title: "Face check",
          message: "I am waiting for the face verification result."
        };
      }

      if (kyc?.kycTier === "FULL") {
        return {
          variant: "verified",
          title: "Full KYC",
          message: "Full payout access is active."
        };
      }

      return {
        variant: selectedSelfie ? "pending" : "idle",
        title: "Higher limits",
        message: selectedSelfie
          ? "Selfie selected. Submit when you are ready."
          : "Choose a clear selfie to unlock higher payouts."
      };

    default:
      if (kyc?.status === "SUBMITTED") {
        return {
          variant: "pending",
          title: "Review queued",
          message: "No extra action is needed right now."
        };
      }

      if (kyc?.kycTier === "FULL") {
        return {
          variant: "verified",
          title: "Verified",
          message: "Full KYC is active."
        };
      }

      if (kyc?.kycTier === "BASIC" && !kyc.livenessRequired) {
        return {
          variant: "verified",
          title: "Basic KYC",
          message: `You can receive up to ${formatMoney(
            kyc.basicKycSettlementCap
          )} before face verification.`
        };
      }

      return {
        variant: getWalletMascotVariant(onboarding),
        title: "Wallet setup",
        message: "I will keep the next step ready here."
      };
  }
};

const SectionCard = ({
  title,
  subtitle,
  actionText,
  onPressAction,
  children
}: {
  title: string;
  subtitle?: string;
  actionText?: string;
  onPressAction?: () => void;
  children: ReactNode;
}) => (
  <CustomView
    style={twStyle("rounded-3xl border border-[#24345A] bg-[#08143B] p-4")}
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
          style={tw`flex-row items-center rounded-full bg-[#0FF1CF] px-3 py-2`}
        >
          <Text style={tw`text-xs font-semibold text-[#01082E]`}>
            {actionText}
          </Text>
          <ChevronRight size={14} color="#01082E" />
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
      style={twStyle("self-start rounded-full px-3 py-1", {
        backgroundColor: tone.bg
      })}
    >
      <Text style={twStyle("text-xs font-semibold", { color: tone.text })}>
        {toTitleCase(label)}
      </Text>
    </View>
  );
};

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <Text style={tw`mb-2 text-xs font-semibold text-[#9FB0D8]`}>{children}</Text>
);

const SetupTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default"
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "phone-pad";
}) => (
  <View style={tw`mb-4`}>
    <FieldLabel>{label}</FieldLabel>
    <TextInput
      autoCapitalize="none"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#62749F"
      keyboardType={keyboardType}
      style={tw`rounded-2xl border border-[#24345A] bg-[#081335] px-4 py-3 text-white`}
    />
  </View>
);

const SetupButton = ({
  label,
  onPress,
  disabled = false,
  tone = "primary"
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      tw`mt-2 flex-row items-center justify-center rounded-full px-4 py-3`,
      tone === "primary"
        ? tw`bg-[#0FF1CF]`
        : tw`border border-[#24345A] bg-[#0A173F]`,
      disabled ? tw`opacity-50` : null
    ]}
  >
    <Text
      style={
        tone === "primary"
          ? tw`text-sm font-semibold text-[#01082E]`
          : tw`text-sm font-semibold text-white`
      }
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const SetupPanel = ({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <View style={tw`mb-4 rounded-3xl border border-[#24345A] bg-[#08143B] p-4`}>
    <Text style={tw`text-base font-semibold text-white`}>{title}</Text>
    {subtitle ? (
      <Text style={tw`mt-1 text-sm leading-5 text-[#9FB0D8]`}>{subtitle}</Text>
    ) : null}
    <View style={tw`mt-4`}>{children}</View>
  </View>
);

type CompactSetupStepStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "FAILED"
  | "LOCKED"
  | "PENDING"
  | "REVIEW";

type CompactSetupStep = {
  code: string;
  title: string;
  subtitle: string;
  status: CompactSetupStepStatus;
  active: boolean;
};

const ACCOUNT_SETUP_STEP_CODES = ["PAYOUT_ACCOUNT"];
const IDENTITY_SETUP_STEP_CODES = [
  "PERSONAL_IDENTITY",
  "BUSINESS_IDENTITY",
  "BUSINESS_NAME_MATCH",
  "REPRESENTATIVE_IDENTITY",
  "NAME_MATCH"
];
const LIMIT_UPGRADE_STEP_CODES = ["LIVENESS"];

const getCompactSetupStepStatus = (
  steps: WalletKycStep[]
): CompactSetupStepStatus => {
  if (!steps.length) {
    return "LOCKED";
  }

  if (steps.some((step) => step.active || step.status === "ACTIVE")) {
    return "ACTIVE";
  }

  if (steps.some((step) => step.status === "FAILED")) {
    return "FAILED";
  }

  if (steps.some((step) => step.status === "REVIEW")) {
    return "REVIEW";
  }

  if (steps.every((step) => step.status === "COMPLETED")) {
    return "COMPLETED";
  }

  if (steps.some((step) => step.status === "PENDING")) {
    return "PENDING";
  }

  return "LOCKED";
};

const buildCompactSetupSteps = (
  steps: WalletKycStep[],
  livenessRequired?: boolean | null,
  kycTier?: string | null,
  accountOwnershipType?: AccountOwnershipType | null
): CompactSetupStep[] => {
  const hasBusinessFlow = steps.some(
    (step) => step.code === "BUSINESS_IDENTITY"
  );
  const getStepsByCode = (codes: string[]) =>
    steps.filter((step) => codes.includes(step.code));
  const identityStepCodes =
    accountOwnershipType === "BUSINESS" &&
    kycTier === "BASIC" &&
    !livenessRequired
      ? ["BUSINESS_IDENTITY", "BUSINESS_NAME_MATCH"]
      : IDENTITY_SETUP_STEP_CODES;
  const businessIdentitySubtitle =
    accountOwnershipType === "BUSINESS" &&
    kycTier === "BASIC" &&
    !livenessRequired
      ? "CAC details"
      : "CAC + rep";
  const makeStep = (
    code: string,
    title: string,
    subtitle: string,
    stepCodes: string[]
  ): CompactSetupStep => {
    const groupedSteps = getStepsByCode(stepCodes);
    const status = getCompactSetupStepStatus(groupedSteps);

    return {
      code,
      title,
      subtitle,
      status,
      active: groupedSteps.some(
        (step) => step.active || step.status === "ACTIVE"
      )
    };
  };

  return [
    makeStep(
      "PAYOUT_ACCOUNT",
      "Payout account",
      "Bank and name",
      ACCOUNT_SETUP_STEP_CODES
    ),
    makeStep(
      "IDENTITY_DETAILS",
      hasBusinessFlow ? "Business details" : "Identity details",
      hasBusinessFlow ? businessIdentitySubtitle : "NIN, BVN, or phone",
      identityStepCodes
    ),
    makeStep(
      "LIMIT_UPGRADE",
      kycTier === "FULL" ? "Full payout access" : "Increase payout limit",
      kycTier === "FULL"
        ? "Higher limits active"
        : livenessRequired
          ? "Face verification"
          : "Optional face check",
      LIMIT_UPGRADE_STEP_CODES
    )
  ];
};

const SetupStepList = ({
  steps,
  livenessRequired,
  kycTier,
  accountOwnershipType
}: {
  steps: WalletKycStep[];
  livenessRequired?: boolean | null;
  kycTier?: string | null;
  accountOwnershipType?: AccountOwnershipType | null;
}) => {
  if (!steps.length) {
    return null;
  }

  const compactSteps = buildCompactSetupSteps(
    steps,
    livenessRequired,
    kycTier,
    accountOwnershipType
  );

  return (
    <View style={tw`mb-4 rounded-3xl border border-[#24345A] bg-[#08143B] p-4`}>
      <Text style={tw`text-base font-semibold text-white`}>Setup steps</Text>
      <View style={tw`mt-4 gap-2`}>
        {compactSteps.map((step, index) => (
          <View
            key={step.code}
            style={[
              tw`flex-row items-center gap-3 rounded-2xl border px-3 py-3`,
              step.active
                ? tw`border-[#0FF1CF] bg-[#0FF1CF]/10`
                : tw`border-[#21315A] bg-[#081335]`
            ]}
          >
            <View
              style={[
                tw`h-7 w-7 items-center justify-center rounded-full`,
                step.status === "COMPLETED"
                  ? tw`bg-[#0F3A32]`
                  : step.active
                    ? tw`bg-[#0FF1CF]`
                    : tw`bg-[#1E2A4C]`
              ]}
            >
              <Text
                style={[
                  tw`text-xs font-bold`,
                  step.active ? tw`text-[#01082E]` : tw`text-white`
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-semibold text-white`}>
                {step.title}
              </Text>
              <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                {step.subtitle}
              </Text>
            </View>
            <StatusPill label={step.active ? "ACTIVE" : step.status} />
          </View>
        ))}
      </View>
    </View>
  );
};

const OwnershipButton = ({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      tw`flex-1 rounded-2xl border px-3 py-3`,
      active
        ? tw`border-[#0FF1CF] bg-[#0FF1CF]/15`
        : tw`border-[#24345A] bg-[#081335]`
    ]}
  >
    <Text
      style={
        active
          ? tw`text-center font-semibold text-[#0FF1CF]`
          : tw`text-center font-semibold text-[#9FB0D8]`
      }
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const EmptyState = ({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) => (
  <View style={tw`items-center justify-center rounded-3xl bg-[#08143B] p-6`}>
    <View style={tw`rounded-2xl bg-[#0FF1CF]/15 p-3`}>
      <WalletIcon size={22} color="#0FF1CF" />
    </View>
    <Text style={tw`mt-4 text-center text-base font-semibold text-white`}>
      {title}
    </Text>
    <Text style={tw`mt-2 text-center text-sm leading-5 text-[#9FB0D8]`}>
      {subtitle}
    </Text>
  </View>
);

const TransactionCard = ({
  transaction
}: {
  transaction: WalletTransaction;
}) => (
  <View style={tw`rounded-2xl border border-[#21315A] bg-[#0A173F] p-4`}>
    <View style={tw`flex-row items-start justify-between gap-3`}>
      <View style={tw`flex-1`}>
        <Text style={tw`text-sm font-semibold text-white`}>
          {transaction.eventTitle || toTitleCase(transaction.paymentType)}
        </Text>
        <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
          {toTitleCase(transaction.paymentType)} via{" "}
          {toTitleCase(transaction.paymentProvider)}
        </Text>
      </View>
      <StatusPill label={transaction.settlementStatus} />
    </View>

    <View style={tw`mt-4 flex-row gap-3`}>
      <View style={tw`flex-1 rounded-2xl bg-[#081335] p-3`}>
        <Text style={tw`text-xs text-[#6F86B4]`}>Gross</Text>
        <Text style={tw`mt-1 text-sm font-semibold text-white`}>
          {formatMoney(transaction.grossAmount)}
        </Text>
      </View>
      <View style={tw`flex-1 rounded-2xl bg-[#081335] p-3`}>
        <Text style={tw`text-xs text-[#6F86B4]`}>Creator share</Text>
        <Text style={tw`mt-1 text-sm font-semibold text-white`}>
          {formatMoney(transaction.creatorPayable)}
        </Text>
      </View>
    </View>

    <Text style={tw`mt-3 text-xs text-[#8FA1CB]`}>
      Buyer: {transaction.buyerUsername || "Unknown"} -{" "}
      {formatDate(transaction.createdAt)}
    </Text>
  </View>
);

const SettlementCard = ({ settlement }: { settlement: WalletSettlement }) => (
  <View style={tw`rounded-2xl border border-[#21315A] bg-[#0A173F] p-4`}>
    <View style={tw`flex-row items-start justify-between gap-3`}>
      <View style={tw`flex-1`}>
        <Text style={tw`text-sm font-semibold text-white`}>
          {formatMoney(settlement.amount)}
        </Text>
        <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
          {settlement.reference} - {settlement.transactionCount} transactions
        </Text>
      </View>
      <StatusPill label={settlement.status} />
    </View>

    <Text style={tw`mt-3 text-sm text-[#9FB0D8]`}>
      {settlement.destinationBankName || "Bank"} -{" "}
      {settlement.destinationAccountNumber || "-"}
    </Text>
    <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
      Created {formatDate(settlement.createdAt)}
    </Text>
  </View>
);

const HistoryFooter = ({
  hasNextPage,
  isFetchingNextPage
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}) => {
  if (isFetchingNextPage) {
    return (
      <View style={tw`py-6`}>
        <ActivityIndicator tone="accent" size="small" />
      </View>
    );
  }

  if (!hasNextPage) {
    return (
      <Text style={tw`py-6 text-center text-xs text-[#6F86B4]`}>
        You are all caught up.
      </Text>
    );
  }

  return <View style={tw`h-8`} />;
};

const HistoryLoading = ({ label }: { label: string }) => (
  <View style={tw`items-center justify-center py-20`}>
    <ActivityIndicator tone="accent" size="large" />
    <Text style={tw`mt-4 text-center text-sm text-[#B7C5E9]`}>{label}</Text>
  </View>
);

const HistoryShell = ({
  title,
  onBack,
  children
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) => (
  <View style={tw`flex-1 bg-[#01082E] px-5 pt-10 pb-4`}>
    <CustomeTopBarNav title={title} onClickBack={onBack} />
    {children}
  </View>
);

const WalletScreen = () => {
  const router = useLockedRouter();
  const { user } = useAuth();
  const overviewQuery = useWalletOverview();
  const onboardingQuery = useWalletOnboarding();
  const [refreshing, setRefreshing] = useState(false);
  const [historyView, setHistoryView] = useState<WalletHistoryView>(null);
  const [setupVisible, setSetupVisible] = useState(false);
  const [setupStepOverride, setSetupStepOverride] = useState<string | null>(
    null
  );
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [walletFocusCycle, setWalletFocusCycle] = useState(0);
  const setupPresentedFocusCycleRef = useRef(0);

  const kycQuery = useWalletKyc({ enabled: setupVisible });
  const banksQuery = useWalletBanks({ enabled: setupVisible });

  const transactionsHistoryQuery = useWalletTransactions(
    WALLET_HISTORY_PAGE_SIZE,
    {
      enabled: historyView === "transactions"
    }
  );
  const settlementsHistoryQuery = useWalletSettlements(
    WALLET_HISTORY_PAGE_SIZE,
    {
      enabled: historyView === "settlements"
    }
  );

  const balance = overviewQuery.data?.data?.balance;
  const payoutProfile = overviewQuery.data?.data?.payoutProfile || null;
  const transactions = overviewQuery.data?.data?.recentTransactions || [];
  const settlements = overviewQuery.data?.data?.recentSettlements || [];
  const onboarding = onboardingQuery.data?.data;
  const kyc = kycQuery.data?.data;
  const shouldAutoOpenSetup = isWalletSetupIncomplete(onboarding);
  const banks = useMemo(
    () => banksQuery.data?.data || [],
    [banksQuery.data?.data]
  );
  const bankPickerItems = useMemo(() => {
    const seenBankCodes = new Set<string>();

    return banks.reduce<{ label: string; value: string }[]>((items, bank) => {
      const bankCode = bank.code || "";

      if (!bankCode || seenBankCodes.has(bankCode)) {
        return items;
      }

      seenBankCodes.add(bankCode);
      items.push({
        label: bank.name || bankCode,
        value: bankCode
      });

      return items;
    }, []);
  }, [banks]);
  const onboardingCopy = getTaskCopy(onboarding);
  const walletMascotVariant = getWalletMascotVariant(onboarding);
  const transactionsPreview = transactions.slice(0, WALLET_PREVIEW_LIMIT);
  const settlementsPreview = settlements.slice(0, WALLET_PREVIEW_LIMIT);
  const fullTransactions =
    transactionsHistoryQuery.data?.pages
      .flatMap((page) =>
        getHistoryPageItems<WalletTransaction>(
          page.data as WalletTransaction[] | { data?: WalletTransaction[] }
        )
      )
      .filter(hasWalletItemId) || [];

  const [ownershipType, setOwnershipType] =
    useState<AccountOwnershipType>("PERSONAL");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedPayoutAccount, setResolvedPayoutAccount] =
    useState<WalletPayoutAccountResolution | null>(null);
  const [resolvedPayoutAccountKey, setResolvedPayoutAccountKey] = useState("");
  const [payoutResolutionError, setPayoutResolutionError] = useState("");
  const payoutResolutionKeyRef = useRef("");
  const lastPayoutResolutionAttemptKeyRef = useRef("");
  const [personalVerificationMode, setPersonalVerificationMode] =
    useState<KycVerificationMode>("PERSONAL_NIN");
  const [personalPhoneNumber, setPersonalPhoneNumber] = useState("");
  const [personalNin, setPersonalNin] = useState("");
  const [personalBvn, setPersonalBvn] = useState("");
  const [personalFirstName, setPersonalFirstName] = useState("");
  const [personalLastName, setPersonalLastName] = useState("");
  const [personalDob, setPersonalDob] = useState("");
  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [representativeVerificationMode, setRepresentativeVerificationMode] =
    useState<KycVerificationMode>("BUSINESS_CAC_REP_NIN");
  const [representativeFirstName, setRepresentativeFirstName] = useState("");
  const [representativeLastName, setRepresentativeLastName] = useState("");
  const [representativeDob, setRepresentativeDob] = useState("");
  const [representativePhone, setRepresentativePhone] = useState("");
  const [representativeNin, setRepresentativeNin] = useState("");
  const [representativeBvn, setRepresentativeBvn] = useState("");
  const [selectedSelfie, setSelectedSelfie] = useState<{
    uri: string;
    base64?: string | null;
  } | null>(null);

  const selectedBank =
    banks.find((bank: WalletBank) => bank.code === selectedBankCode) || null;
  const normalizedAccountNumber = normalizePayoutAccountNumber(accountNumber);
  const payoutResolutionKey = buildPayoutResolutionKey(
    selectedBankCode,
    normalizedAccountNumber
  );
  payoutResolutionKeyRef.current = payoutResolutionKey;
  const canResolvePayoutAccount = Boolean(
    selectedBankCode &&
      selectedBank?.name &&
      /^\d{10}$/.test(normalizedAccountNumber)
  );
  const hasResolvedPayoutAccount = Boolean(
    resolvedPayoutAccount && resolvedPayoutAccountKey === payoutResolutionKey
  );
  const canSavePayoutAccount = Boolean(
    hasResolvedPayoutAccount && selectedBank?.name
  );
  const kycSteps = kyc?.steps || [];
  const rawCurrentKycStep =
    kyc?.currentStep || kycSteps.find((step) => step.active)?.code || null;
  const businessFullKycIsOptional =
    kyc?.accountOwnershipType === "BUSINESS" &&
    kyc?.kycTier === "BASIC" &&
    !kyc?.livenessRequired;
  const shouldShowWalletStatus =
    kyc?.status === "SUBMITTED" ||
    kyc?.kycTier === "FULL" ||
    (kyc?.kycTier === "BASIC" && !kyc?.livenessRequired);
  const currentKycStep =
    (rawCurrentKycStep === "LIVENESS" &&
      kyc?.kycTier === "BASIC" &&
      !kyc?.livenessRequired) ||
    (rawCurrentKycStep === "REPRESENTATIVE_IDENTITY" &&
      businessFullKycIsOptional)
      ? "WALLET_STATUS"
      : rawCurrentKycStep || (shouldShowWalletStatus ? "WALLET_STATUS" : null);
  const activeSetupStep =
    setupStepOverride || currentKycStep || "PAYOUT_ACCOUNT";
  const currentPersonalVerificationMode = normalizePersonalVerificationMode(
    personalVerificationMode
  );
  const currentBusinessVerificationMode = normalizeBusinessVerificationMode(
    representativeVerificationMode
  );
  const currentOwnershipType = ownershipType;
  const personalIdentityNumber =
    currentPersonalVerificationMode === "PERSONAL_BVN"
      ? personalBvn.trim()
      : currentPersonalVerificationMode === "PERSONAL_PHONE"
        ? personalPhoneNumber.trim()
        : personalNin.trim();
  const representativeIdentityNumber =
    currentBusinessVerificationMode === "BUSINESS_CAC_REP_BVN"
      ? representativeBvn.trim()
      : currentBusinessVerificationMode === "BUSINESS_CAC_REP_PHONE"
        ? representativePhone.trim()
        : representativeNin.trim();
  const isBusinessVerificationVerified = kyc?.businessStatus === "VERIFIED";
  const isIdentityVerified = kyc?.identityStatus === "VERIFIED";
  const isIdentityReviewable = kyc?.identityStatus === "SUBMITTED";
  const isIdentityPending = kyc?.identityStatus === "PENDING_PROVIDER";
  const canStartBusinessRepresentative =
    activeSetupStep === "REPRESENTATIVE_IDENTITY" &&
    currentOwnershipType === "BUSINESS" &&
    isBusinessVerificationVerified;
  const canSubmitLiveness =
    activeSetupStep === "LIVENESS" &&
    (currentOwnershipType === "BUSINESS"
      ? isBusinessVerificationVerified &&
        (isIdentityVerified || isIdentityReviewable)
      : isIdentityVerified);
  const fullSettlements =
    settlementsHistoryQuery.data?.pages
      .flatMap((page) =>
        getHistoryPageItems<WalletSettlement>(
          page.data as WalletSettlement[] | { data?: WalletSettlement[] }
        )
      )
      .filter(hasWalletItemId) || [];

  const resolvePayoutAccountMutation = useResolveWalletPayoutAccount();

  const payoutMutation = useUpsertWalletPayoutProfile({
    onSuccess: async () => {
      showGlobalSuccess("Payout account saved.");
      setSetupStepOverride(null);
      await refreshWalletSetup();
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't save this payout account right now. Please try again later."
        )
      );
    }
  });

  const startPersonalKycMutation = useStartPersonalKyc({
    onSuccess: async (response: WalletKycResponse) => {
      showGlobalSuccess(
        getKycProgressMessage(response.data, "Personal identity check started.")
      );
      setSetupStepOverride(null);
      await refreshWalletSetup();
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't start identity verification right now. Please try again later."
        )
      );
    }
  });

  const startBusinessKycMutation = useStartBusinessKyc({
    onSuccess: async (response: WalletKycResponse) => {
      showGlobalSuccess(
        getKycProgressMessage(response.data, "Business verification started.")
      );
      setSetupStepOverride(null);
      await refreshWalletSetup();
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't start business verification right now. Please try again later."
        )
      );
    }
  });

  const startBusinessRepresentativeKycMutation =
    useStartBusinessRepresentativeKyc({
      onSuccess: async (response: WalletKycResponse) => {
        showGlobalSuccess(
          getKycProgressMessage(
            response.data,
            "Representative identity check started."
          )
        );
        setSetupStepOverride(null);
        await refreshWalletSetup();
      },
      onError: (error: any) => {
        showGlobalError(
          getWalletFriendlyErrorMessage(
            error,
            "We couldn't start representative verification right now. Please try again later."
          )
        );
      }
    });

  const submitLivenessMutation = useSubmitWalletLiveness({
    onSuccess: async (response: WalletKycResponse) => {
      showGlobalSuccess(
        getKycProgressMessage(response.data, "Selfie submitted.")
      );
      setSetupStepOverride(null);
      setSelectedSelfie(null);
      await refreshWalletSetup();
    },
    onError: (error: any) => {
      showGlobalError(
        getWalletFriendlyErrorMessage(
          error,
          "We couldn't submit face verification right now. Please try again later."
        )
      );
    }
  });

  const busy =
    resolvePayoutAccountMutation.isPending ||
    payoutMutation.isPending ||
    startPersonalKycMutation.isPending ||
    startBusinessKycMutation.isPending ||
    startBusinessRepresentativeKycMutation.isPending ||
    submitLivenessMutation.isPending;
  const setupMascotMoment = getSetupMascotMoment({
    activeSetupStep,
    setupLoading: kycQuery.isLoading,
    kyc,
    onboarding,
    resolvePayoutAccountPending: resolvePayoutAccountMutation.isPending,
    hasResolvedPayoutAccount,
    resolvedPayoutAccount,
    payoutResolutionError,
    selectedSelfie: Boolean(selectedSelfie)
  });

  async function refreshWalletSetup() {
    await Promise.all([
      overviewQuery.refetch(),
      onboardingQuery.refetch(),
      kycQuery.refetch()
    ]);
  }

  const openSetupModal = useCallback(() => {
    setupPresentedFocusCycleRef.current = walletFocusCycle;

    const profileOwnership =
      payoutProfile?.accountOwnershipType &&
      payoutProfile.accountOwnershipType !== "UNKNOWN"
        ? payoutProfile.accountOwnershipType
        : "PERSONAL";
    const profileBankCode = payoutProfile?.bankCode || selectedBankCode;
    const profileAccountNumber = payoutProfile?.accountNumber || "";
    const personalNameParts = splitFullName(
      payoutProfile?.legalName || kyc?.verifiedFullName || user?.name || ""
    );
    const representativeNameParts = splitFullName(
      kyc?.verifiedFullName || payoutProfile?.legalName || user?.name || ""
    );

    setOwnershipType(
      getOwnershipTypeFromResolvedAccountName(
        payoutProfile?.accountName,
        profileOwnership
      )
    );
    setSelectedBankCode(profileBankCode);
    setAccountNumber(profileAccountNumber);
    setResolvedPayoutAccount(
      payoutProfile?.accountName && profileAccountNumber
        ? {
            accountNumber: normalizePayoutAccountNumber(profileAccountNumber),
            accountName: payoutProfile.accountName
          }
        : null
    );
    setResolvedPayoutAccountKey(
      payoutProfile?.accountName && profileAccountNumber
        ? buildPayoutResolutionKey(profileBankCode, profileAccountNumber)
        : ""
    );
    setPersonalVerificationMode(
      normalizePersonalVerificationMode(kyc?.verificationMode)
    );
    setPersonalPhoneNumber(user?.phoneNumber || "");
    setPersonalFirstName(personalNameParts.firstName);
    setPersonalLastName(personalNameParts.lastName);
    setRepresentativeVerificationMode(
      normalizeBusinessVerificationMode(kyc?.verificationMode)
    );
    setRepresentativeFirstName(representativeNameParts.firstName);
    setRepresentativeLastName(representativeNameParts.lastName);
    setRepresentativePhone(user?.phoneNumber || "");
    setSetupStepOverride(null);
    setSetupVisible(true);
  }, [
    kyc?.verificationMode,
    kyc?.verifiedFullName,
    payoutProfile?.accountName,
    payoutProfile?.accountNumber,
    payoutProfile?.accountOwnershipType,
    payoutProfile?.bankCode,
    payoutProfile?.legalName,
    selectedBankCode,
    user?.name,
    user?.phoneNumber,
    walletFocusCycle
  ]);

  useFocusEffect(
    useCallback(() => {
      setWalletFocusCycle((current) => current + 1);
    }, [])
  );

  useEffect(() => {
    if (
      walletFocusCycle === 0 ||
      setupPresentedFocusCycleRef.current === walletFocusCycle ||
      setupVisible ||
      onboardingQuery.isLoading ||
      onboardingQuery.isError ||
      !shouldAutoOpenSetup
    ) {
      return;
    }

    setupPresentedFocusCycleRef.current = walletFocusCycle;
    openSetupModal();
  }, [
    onboardingQuery.isError,
    onboardingQuery.isLoading,
    openSetupModal,
    setupVisible,
    shouldAutoOpenSetup,
    walletFocusCycle
  ]);

  const clearResolvedPayoutAccount = () => {
    setResolvedPayoutAccount(null);
    setResolvedPayoutAccountKey("");
    setPayoutResolutionError("");
    lastPayoutResolutionAttemptKeyRef.current = "";
  };

  const handleBankCodeChange = (value: string) => {
    setSelectedBankCode(value);
    setBankPickerOpen(false);
    clearResolvedPayoutAccount();
  };

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value);
    clearResolvedPayoutAccount();
  };

  useEffect(() => {
    if (
      !setupVisible ||
      activeSetupStep !== "PAYOUT_ACCOUNT" ||
      !canResolvePayoutAccount ||
      hasResolvedPayoutAccount ||
      resolvePayoutAccountMutation.isPending ||
      lastPayoutResolutionAttemptKeyRef.current === payoutResolutionKey
    ) {
      return;
    }

    const resolutionKey = payoutResolutionKey;
    const bankCode = selectedBankCode;
    const accountNumberToResolve = normalizedAccountNumber;

    const resolveTimer = setTimeout(() => {
      lastPayoutResolutionAttemptKeyRef.current = resolutionKey;
      setPayoutResolutionError("");

      resolvePayoutAccountMutation
        .mutateAsync({
          bankCode,
          accountNumber: accountNumberToResolve
        })
        .then((response) => {
          if (payoutResolutionKeyRef.current !== resolutionKey) {
            return;
          }

          const resolvedAccount = response.data;

          setResolvedPayoutAccount(resolvedAccount);
          setResolvedPayoutAccountKey(resolutionKey);
          setOwnershipType((currentType) =>
            getOwnershipTypeFromResolvedAccountName(
              resolvedAccount.accountName,
              currentType
            )
          );
        })
        .catch((error: any) => {
          if (payoutResolutionKeyRef.current !== resolutionKey) {
            return;
          }

          setResolvedPayoutAccount(null);
          setResolvedPayoutAccountKey("");
          setPayoutResolutionError(
            getWalletFriendlyErrorMessage(
              error,
              "We couldn't resolve this account. Check the bank and account number."
            )
          );
        });
    }, 650);

    return () => {
      clearTimeout(resolveTimer);
    };
  }, [
    activeSetupStep,
    canResolvePayoutAccount,
    hasResolvedPayoutAccount,
    normalizedAccountNumber,
    payoutResolutionKey,
    resolvePayoutAccountMutation,
    selectedBankCode,
    setupVisible
  ]);

  const handleSavePayoutProfile = async () => {
    if (!selectedBankCode || !selectedBank?.name) {
      showGlobalWarning(
        "Choose the bank that matches your settlement account."
      );
      return;
    }

    if (!/^\d{10}$/.test(normalizedAccountNumber)) {
      showGlobalWarning("Enter the settlement account number.");
      return;
    }

    if (!hasResolvedPayoutAccount) {
      showGlobalWarning("Resolve the account name before saving.");
      return;
    }

    const accountOwnershipType = getOwnershipTypeFromResolvedAccountName(
      resolvedPayoutAccount?.accountName,
      currentOwnershipType
    );

    await payoutMutation.mutateAsync({
      accountOwnershipType,
      bankCode: selectedBankCode,
      bankName: selectedBank.name,
      accountNumber: normalizedAccountNumber
    });
  };

  const handleStartPersonalKyc = async () => {
    if (!payoutProfile?.bankName && !selectedBank?.name) {
      showGlobalWarning("Add your settlement account first.");
      return;
    }

    if (!personalFirstName.trim() || !personalLastName.trim()) {
      showGlobalWarning("Enter your first and last name.");
      return;
    }

    if (!personalIdentityNumber) {
      showGlobalWarning("Enter the identity number for the selected method.");
      return;
    }

    await startPersonalKycMutation.mutateAsync({
      verificationMode: currentPersonalVerificationMode,
      phoneNumber: personalPhoneNumber.trim() || undefined,
      bvn:
        currentPersonalVerificationMode === "PERSONAL_BVN"
          ? personalBvn.trim()
          : undefined,
      nin:
        currentPersonalVerificationMode === "PERSONAL_NIN"
          ? personalNin.trim()
          : undefined,
      firstName: personalFirstName.trim(),
      lastName: personalLastName.trim(),
      dateOfBirth: personalDob.trim() || undefined
    });
  };

  const handleStartBusinessKyc = async () => {
    if (!businessRegNumber.trim()) {
      showGlobalWarning("Enter the CAC registration number.");
      return;
    }

    await startBusinessKycMutation.mutateAsync({
      regNumber: businessRegNumber.trim(),
      businessName: payoutProfile?.businessName || undefined
    });
  };

  const handleStartBusinessRepresentativeKyc = async () => {
    if (!canStartBusinessRepresentative) {
      showGlobalWarning("Verify the CAC record before continuing.");
      return;
    }

    if (!representativeFirstName.trim() || !representativeLastName.trim()) {
      showGlobalWarning("Enter the representative's first and last name.");
      return;
    }

    if (!representativeIdentityNumber) {
      showGlobalWarning("Enter the representative's identity number.");
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
          ? representativeNin.trim()
          : undefined,
      representativeBvn:
        currentBusinessVerificationMode === "BUSINESS_CAC_REP_BVN"
          ? representativeBvn.trim()
          : undefined
    });
  };

  const pickSelfie = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showGlobalWarning(
        "Photo library access is needed to submit your selfie."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedSelfie({
        uri: asset?.uri || "",
        base64: asset?.base64 || null
      });
    }
  };

  const handleSubmitLiveness = async () => {
    if (!canSubmitLiveness) {
      showGlobalWarning(
        isIdentityPending
          ? "Identity verification is still in progress."
          : "Complete the previous verification step before submitting face verification."
      );
      return;
    }

    if (!selectedSelfie?.base64) {
      showGlobalWarning("Choose a selfie image first.");
      return;
    }

    await submitLivenessMutation.mutateAsync({
      photoBase64: selectedSelfie.base64
    });
  };

  const renderNameMatchPanel = () => {
    const verifiedName =
      currentOwnershipType === "BUSINESS"
        ? kyc?.verifiedBusinessName
        : kyc?.verifiedFullName;
    const retryStep =
      currentOwnershipType === "BUSINESS"
        ? "BUSINESS_IDENTITY"
        : "PERSONAL_IDENTITY";

    return (
      <SetupPanel
        title="Name match"
      >
        <View style={tw`mb-4 flex-row flex-wrap gap-2`}>
          <StatusPill label={kyc?.nameMatchStatus || "NOT_CHECKED"} />
        </View>
        <View style={tw`mb-4 rounded-2xl bg-[#081335] p-4`}>
          <Text style={tw`text-xs text-[#8FA1CB]`}>Payout account name</Text>
          <Text style={tw`mt-1 text-sm font-semibold text-white`}>
            {payoutProfile?.accountName || "Not available"}
          </Text>
          <Text style={tw`mt-4 text-xs text-[#8FA1CB]`}>
            Verified{" "}
            {currentOwnershipType === "BUSINESS" ? "business" : "identity"} name
          </Text>
          <Text style={tw`mt-1 text-sm font-semibold text-white`}>
            {verifiedName || "Not available"}
          </Text>
          {kyc?.nameMatchReason ? (
            <Text style={tw`mt-4 text-sm leading-5 text-[#FFD76A]`}>
              {kyc.nameMatchReason}
            </Text>
          ) : null}
        </View>
        <SetupButton
          label="Edit payout account"
          onPress={() => setSetupStepOverride("PAYOUT_ACCOUNT")}
          disabled={busy}
          tone="secondary"
        />
        <SetupButton
          label={
            currentOwnershipType === "BUSINESS"
              ? "Retry CAC details"
              : "Retry identity details"
          }
          onPress={() => setSetupStepOverride(retryStep)}
          disabled={busy}
        />
      </SetupPanel>
    );
  };

  const renderSetupStep = () => {
    if (kycQuery.isLoading) {
      return (
        <SetupPanel title="Loading setup">
          <View style={tw`py-6`}>
            <ActivityIndicator tone="accent" size="small" />
          </View>
        </SetupPanel>
      );
    }

    switch (activeSetupStep) {
      case "PAYOUT_ACCOUNT":
        return (
          <SetupPanel title="Payout account">
            <View style={tw`mb-4 flex-row gap-3`}>
              <OwnershipButton
                label="Personal"
                active={currentOwnershipType === "PERSONAL"}
                onPress={() => setOwnershipType("PERSONAL")}
              />
              <OwnershipButton
                label="Business"
                active={currentOwnershipType === "BUSINESS"}
                onPress={() => setOwnershipType("BUSINESS")}
              />
            </View>

            <View style={tw`mb-4`}>
              <FieldLabel>Bank</FieldLabel>
              <DropDownPicker
                open={bankPickerOpen}
                value={selectedBankCode || null}
                items={bankPickerItems}
                setOpen={setBankPickerOpen}
                setValue={(callback) => {
                  const nextValue =
                    typeof callback === "function"
                      ? callback(selectedBankCode || null)
                      : callback;

                  handleBankCodeChange(String(nextValue || ""));
                }}
                searchable
                listMode="MODAL"
                modalTitle="Select bank"
                modalAnimationType="slide"
                searchPlaceholder="Search bank"
                searchPlaceholderTextColor="#62749F"
                placeholder={
                  banksQuery.isLoading ? "Loading banks..." : "Select bank"
                }
                disabled={banksQuery.isLoading}
                style={tw`rounded-2xl border border-[#24345A] bg-[#081335]`}
                textStyle={tw`text-white`}
                placeholderStyle={tw`text-[#62749F]`}
                dropDownContainerStyle={tw`border border-[#24345A] bg-[#081335]`}
                modalContentContainerStyle={tw`bg-[#01082E] px-5 pt-10 pb-5`}
                modalTitleStyle={tw`text-lg font-semibold text-white`}
                searchContainerStyle={tw`border-b border-[#24345A] px-0 pb-4`}
                searchTextInputStyle={tw`rounded-2xl border border-[#24345A] bg-[#081335] px-4 py-3 text-white`}
                listItemContainerStyle={tw`border-b border-[#182857] py-3`}
                listItemLabelStyle={tw`text-white`}
                selectedItemContainerStyle={tw`bg-[#0FF1CF]/10`}
                selectedItemLabelStyle={tw`font-semibold text-[#0FF1CF]`}
                listMessageTextStyle={tw`text-center text-sm text-[#9FB0D8]`}
                ListEmptyComponent={() => (
                  <Text style={tw`py-8 text-center text-sm text-[#9FB0D8]`}>
                    No banks match your search.
                  </Text>
                )}
              />
              {banksQuery.isError ? (
                <Text style={tw`mt-2 text-xs text-[#FFD76A]`}>
                  Could not load banks right now.
                </Text>
              ) : null}
            </View>

            <SetupTextInput
              label="Account number"
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              placeholder="10 digit account number"
              keyboardType="number-pad"
            />

            {hasResolvedPayoutAccount ? (
              <View style={tw`mb-3 mt-4`}>
                <Text style={tw`text-xs uppercase text-[#8FA1CB]`}>
                  Account name
                </Text>
                <Text style={tw`mt-1 text-base font-semibold text-white`}>
                  {resolvedPayoutAccount?.accountName}
                </Text>
                <Text style={tw`mt-1 text-xs text-[#9FB0D8]`}>
                  {selectedBank?.name || "Bank"} - {normalizedAccountNumber}
                </Text>
              </View>
            ) : payoutResolutionError ? (
              <Text style={tw`mb-3 text-xs text-[#FFD76A]`}>
                {payoutResolutionError}
              </Text>
            ) : null}

            <SetupButton
              label={payoutMutation.isPending ? "Saving..." : "Save account"}
              onPress={() => {
                void handleSavePayoutProfile();
              }}
              disabled={busy || !canSavePayoutAccount}
            />
          </SetupPanel>
        );

      case "PERSONAL_IDENTITY":
        return (
          <SetupPanel title="Personal identity">
            <View style={tw`mb-4`}>
              <FieldLabel>Verification method</FieldLabel>
              <View
                style={tw`overflow-hidden rounded-2xl border border-[#24345A] bg-[#081335]`}
              >
                <Picker
                  selectedValue={personalVerificationMode}
                  onValueChange={(value) =>
                    setPersonalVerificationMode(value as KycVerificationMode)
                  }
                  dropdownIconColor="#FFFFFF"
                  style={tw`text-white`}
                >
                  <Picker.Item label="NIN" value="PERSONAL_NIN" />
                  <Picker.Item label="BVN" value="PERSONAL_BVN" />
                  <Picker.Item label="Phone" value="PERSONAL_PHONE" />
                </Picker>
              </View>
            </View>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <SetupTextInput
                  label="First name"
                  value={personalFirstName}
                  onChangeText={setPersonalFirstName}
                />
              </View>
              <View style={tw`flex-1`}>
                <SetupTextInput
                  label="Last name"
                  value={personalLastName}
                  onChangeText={setPersonalLastName}
                />
              </View>
            </View>
            <SetupTextInput
              label="Phone number"
              value={personalPhoneNumber}
              onChangeText={setPersonalPhoneNumber}
              keyboardType="phone-pad"
            />
            {currentPersonalVerificationMode === "PERSONAL_BVN" ? (
              <SetupTextInput
                label="BVN"
                value={personalBvn}
                onChangeText={setPersonalBvn}
                keyboardType="number-pad"
              />
            ) : currentPersonalVerificationMode === "PERSONAL_PHONE" ? null : (
              <SetupTextInput
                label="NIN"
                value={personalNin}
                onChangeText={setPersonalNin}
                keyboardType="number-pad"
              />
            )}
            <SetupTextInput
              label="Date of birth"
              value={personalDob}
              onChangeText={setPersonalDob}
              placeholder="YYYY-MM-DD"
            />
            <SetupButton
              label={
                startPersonalKycMutation.isPending
                  ? "Starting..."
                  : "Start identity check"
              }
              onPress={() => {
                void handleStartPersonalKyc();
              }}
              disabled={busy || isIdentityVerified || isIdentityPending}
            />
          </SetupPanel>
        );

      case "BUSINESS_IDENTITY":
        return (
          <SetupPanel title="Business verification">
            <SetupTextInput
              label="CAC registration number"
              value={businessRegNumber}
              onChangeText={setBusinessRegNumber}
            />
            <SetupButton
              label={
                startBusinessKycMutation.isPending
                  ? "Starting..."
                  : "Start CAC verification"
              }
              onPress={() => {
                void handleStartBusinessKyc();
              }}
              disabled={
                busy ||
                isBusinessVerificationVerified ||
                kyc?.businessStatus === "PENDING_PROVIDER"
              }
            />
          </SetupPanel>
        );

      case "NAME_MATCH":
      case "BUSINESS_NAME_MATCH":
        return renderNameMatchPanel();

      case "REPRESENTATIVE_IDENTITY":
        return (
          <SetupPanel title="Representative identity">
            <View style={tw`mb-4`}>
              <FieldLabel>Representative method</FieldLabel>
              <View
                style={tw`overflow-hidden rounded-2xl border border-[#24345A] bg-[#081335]`}
              >
                <Picker
                  selectedValue={representativeVerificationMode}
                  onValueChange={(value) =>
                    setRepresentativeVerificationMode(
                      value as KycVerificationMode
                    )
                  }
                  dropdownIconColor="#FFFFFF"
                  style={tw`text-white`}
                >
                  <Picker.Item label="NIN" value="BUSINESS_CAC_REP_NIN" />
                  <Picker.Item label="BVN" value="BUSINESS_CAC_REP_BVN" />
                  <Picker.Item label="Phone" value="BUSINESS_CAC_REP_PHONE" />
                </Picker>
              </View>
            </View>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <SetupTextInput
                  label="First name"
                  value={representativeFirstName}
                  onChangeText={setRepresentativeFirstName}
                />
              </View>
              <View style={tw`flex-1`}>
                <SetupTextInput
                  label="Last name"
                  value={representativeLastName}
                  onChangeText={setRepresentativeLastName}
                />
              </View>
            </View>
            <SetupTextInput
              label="Phone number"
              value={representativePhone}
              onChangeText={setRepresentativePhone}
              keyboardType="phone-pad"
            />
            {currentBusinessVerificationMode === "BUSINESS_CAC_REP_BVN" ? (
              <SetupTextInput
                label="BVN"
                value={representativeBvn}
                onChangeText={setRepresentativeBvn}
                keyboardType="number-pad"
              />
            ) : currentBusinessVerificationMode ===
              "BUSINESS_CAC_REP_PHONE" ? null : (
              <SetupTextInput
                label="NIN"
                value={representativeNin}
                onChangeText={setRepresentativeNin}
                keyboardType="number-pad"
              />
            )}
            <SetupTextInput
              label="Date of birth"
              value={representativeDob}
              onChangeText={setRepresentativeDob}
              placeholder="YYYY-MM-DD"
            />
            <SetupButton
              label={
                startBusinessRepresentativeKycMutation.isPending
                  ? "Starting..."
                  : "Start representative check"
              }
              onPress={() => {
                void handleStartBusinessRepresentativeKyc();
              }}
              disabled={busy || !canStartBusinessRepresentative}
            />
          </SetupPanel>
        );

      case "LIVENESS":
        return (
          <SetupPanel
            title={
              kyc?.livenessRequired
                ? "Face verification required"
                : "Upgrade to Full KYC"
            }
          >
            <View style={tw`mb-4 rounded-2xl bg-[#081335] p-4`}>
              <Text style={tw`text-xs text-[#8FA1CB]`}>Basic usage</Text>
              <Text style={tw`mt-1 text-sm font-semibold text-white`}>
                {formatMoney(kyc?.basicKycSettlementUsage)} of{" "}
                {formatMoney(kyc?.basicKycSettlementCap)}
              </Text>
              <Text style={tw`mt-2 text-sm leading-5 text-[#9FB0D8]`}>
                Remaining under Basic:{" "}
                {formatMoney(kyc?.basicKycSettlementRemaining)}
              </Text>
            </View>
            <SetupButton
              label={selectedSelfie ? "Selfie selected" : "Choose selfie"}
              onPress={() => {
                void pickSelfie();
              }}
              disabled={busy || !canSubmitLiveness}
              tone="secondary"
            />
            <SetupButton
              label={
                submitLivenessMutation.isPending
                  ? "Submitting..."
                  : "Submit face verification"
              }
              onPress={() => {
                void handleSubmitLiveness();
              }}
              disabled={busy || !canSubmitLiveness || !selectedSelfie?.base64}
            />
          </SetupPanel>
        );

      default:
        return (
          <SetupPanel
            title={
              kyc?.status === "SUBMITTED"
                ? "KYC under review"
                : kyc?.kycTier === "FULL"
                  ? "Full KYC complete"
                  : kyc?.kycTier === "BASIC"
                    ? "Basic KYC active"
                    : "Wallet setup"
            }
          >
            {kyc?.rejectionReason ? (
              <Text style={tw`text-sm leading-5 text-[#FFD76A]`}>
                {kyc.rejectionReason}
              </Text>
            ) : null}
            {kyc?.kycTier === "BASIC" && !kyc?.livenessRequired ? (
              <SetupButton
                label="Increase payout limit"
                onPress={() =>
                  setSetupStepOverride(
                    kyc.accountOwnershipType === "BUSINESS" &&
                      !isIdentityVerified &&
                      !isIdentityReviewable
                      ? "REPRESENTATIVE_IDENTITY"
                      : "LIVENESS"
                  )
                }
                disabled={busy || kyc.livenessStatus === "PENDING_PROVIDER"}
                tone="secondary"
              />
            ) : null}
          </SetupPanel>
        );
    }
  };

  const refetchAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        overviewQuery.refetch(),
        onboardingQuery.refetch(),
        setupVisible ? kycQuery.refetch() : Promise.resolve()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const transactionsRefreshing =
    transactionsHistoryQuery.isRefetching &&
    !transactionsHistoryQuery.isFetchingNextPage;
  const settlementsRefreshing =
    settlementsHistoryQuery.isRefetching &&
    !settlementsHistoryQuery.isFetchingNextPage;
  const isInitialLoading = overviewQuery.isLoading || onboardingQuery.isLoading;

  if (historyView === "transactions") {
    return (
      <HistoryShell title="Transactions" onBack={() => setHistoryView(null)}>
        <FlatList
          data={fullTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          ItemSeparatorComponent={() => <View style={tw`h-3`} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={twStyle(
            "pb-8 pt-4",
            fullTransactions.length === 0 && "flex-grow justify-center"
          )}
          ListHeaderComponent={
            <RefreshIndicator refreshing={transactionsRefreshing} />
          }
          refreshControl={
            <AppRefreshControl
              refreshing={transactionsRefreshing}
              onRefresh={() => {
                void transactionsHistoryQuery.refetch();
              }}
            />
          }
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (
              transactionsHistoryQuery.hasNextPage &&
              !transactionsHistoryQuery.isFetchingNextPage
            ) {
              void transactionsHistoryQuery.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            transactionsHistoryQuery.isLoading ? (
              <HistoryLoading label="Loading transaction history..." />
            ) : (
              <EmptyState
                title="No transactions yet"
                subtitle="Event collections will appear here."
              />
            )
          }
          ListFooterComponent={
            fullTransactions.length ? (
              <HistoryFooter
                hasNextPage={Boolean(transactionsHistoryQuery.hasNextPage)}
                isFetchingNextPage={transactionsHistoryQuery.isFetchingNextPage}
              />
            ) : null
          }
        />
      </HistoryShell>
    );
  }

  if (historyView === "settlements") {
    return (
      <HistoryShell
        title="Settlement History"
        onBack={() => setHistoryView(null)}
      >
        <FlatList
          data={fullSettlements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SettlementCard settlement={item} />}
          ItemSeparatorComponent={() => <View style={tw`h-3`} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={twStyle(
            "pb-8 pt-4",
            fullSettlements.length === 0 && "flex-grow justify-center"
          )}
          ListHeaderComponent={
            <RefreshIndicator refreshing={settlementsRefreshing} />
          }
          refreshControl={
            <AppRefreshControl
              refreshing={settlementsRefreshing}
              onRefresh={() => {
                void settlementsHistoryQuery.refetch();
              }}
            />
          }
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (
              settlementsHistoryQuery.hasNextPage &&
              !settlementsHistoryQuery.isFetchingNextPage
            ) {
              void settlementsHistoryQuery.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            settlementsHistoryQuery.isLoading ? (
              <HistoryLoading label="Loading settlement history..." />
            ) : (
              <EmptyState
                title="No settlements yet"
                subtitle="Payout batches will appear here."
              />
            )
          }
          ListFooterComponent={
            fullSettlements.length ? (
              <HistoryFooter
                hasNextPage={Boolean(settlementsHistoryQuery.hasNextPage)}
                isFetchingNextPage={settlementsHistoryQuery.isFetchingNextPage}
              />
            ) : null
          }
        />
      </HistoryShell>
    );
  }

  if (isInitialLoading) {
    return (
      <ImpactPageLoader
        title="Mapping your wallet"
        message="Loading your balances, payments, and payouts."
      />
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
          <AppRefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
          />
        }
        contentContainerStyle={tw`pb-12 pt-4`}
      >
        <RefreshIndicator refreshing={refreshing} />
        <CustomView
          style={twStyle(
            "rounded-[28px] border border-[#1D335E] bg-[#091538] p-5",
            {
              shadowColor: "#0FF1CF",
              shadowOpacity: 0.12,
              shadowRadius: 18
            }
          )}
        >
          <View style={tw`flex-row items-start justify-between gap-3`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-2xl font-bold text-white`}>
                {formatMoney(balance?.totalCollected)}
              </Text>
              <Text style={tw`mt-2 text-sm leading-5 text-[#B7C5E9]`}>
                Total collected
              </Text>
            </View>
            <View style={tw`rounded-2xl bg-[#0FF1CF]/15 p-3`}>
              <WalletIcon size={22} color="#0FF1CF" />
            </View>
          </View>

          <View style={tw`mt-4 rounded-3xl bg-[#0A173F] p-4`}>
            <View style={tw`flex-row items-start gap-3`}>
              <GatherGoMascot
                variant={walletMascotVariant}
                size={72}
                style={tw`shrink-0`}
              />
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
                    </View>
                    <StatusPill label={task.status} />
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={openSetupModal}
              style={tw`mt-4 flex-row items-center justify-center rounded-full bg-[#0FF1CF] px-4 py-3`}
            >
              <Text style={tw`text-sm font-semibold text-[#01082E]`}>
                {onboardingCopy.action}
              </Text>
              <ChevronRight size={16} color="#01082E" />
            </TouchableOpacity>
          </View>
        </CustomView>

        <CustomView style={tw`flex-row flex-wrap gap-3`}>
          {[
            {
              label: "Available",
              value: formatMoney(balance?.availableBalance),
              icon: CircleDollarSign,
              color: "#0FF1CF"
            },
            {
              label: "Held",
              value: formatMoney(balance?.heldBalance),
              icon: Clock3,
              color: "#FFD76A"
            },
            {
              label: "Processing",
              value: formatMoney(balance?.processingBalance),
              icon: Loader,
              color: "#9FB0D8"
            },
            {
              label: "Settled",
              value: formatMoney(balance?.settledBalance),
              icon: CheckCircle2,
              color: "#7CFFB2"
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={twStyle(
                  "min-w-[48%] flex-1 rounded-3xl border border-[#1E3157] bg-[#08143B] p-4"
                )}
              >
                <View style={tw`flex-row items-center justify-between`}>
                  <Text style={tw`text-xs text-[#8FA1CB]`}>{item.label}</Text>
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
          title="Recent transactions"
          subtitle="Latest event collections."
          actionText={transactions.length ? "View more" : undefined}
          onPressAction={() => setHistoryView("transactions")}
        >
          {transactionsPreview.length ? (
            <View style={tw`gap-3`}>
              {transactionsPreview.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </View>
          ) : (
            <Text style={tw`text-sm leading-5 text-[#9FB0D8]`}>
              No transactions yet.
            </Text>
          )}
        </SectionCard>

        <SectionCard
          title="Settlement history"
          subtitle="Latest payout batches."
          actionText={settlements.length ? "View more" : undefined}
          onPressAction={() => setHistoryView("settlements")}
        >
          {settlementsPreview.length ? (
            <View style={tw`gap-3`}>
              {settlementsPreview.map((settlement) => (
                <SettlementCard key={settlement.id} settlement={settlement} />
              ))}
            </View>
          ) : (
            <Text style={tw`text-sm leading-5 text-[#9FB0D8]`}>
              No settlements yet.
            </Text>
          )}
        </SectionCard>
      </ScrollView>

      <Modal
        visible={setupVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSetupVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={tw`flex-1 bg-[#01082E]`}
        >
          <View style={tw`flex-1 px-5 pt-10 pb-4`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-xl font-bold text-white`}>
                  Wallet setup
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSetupVisible(false)}
                style={tw`rounded-full bg-[#102052] p-3`}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`pb-10 pt-5`}
            >
              <MascotMoment
                variant={setupMascotMoment.variant}
                title={setupMascotMoment.title}
                message={setupMascotMoment.message}
                compact
                style={tw`mb-4`}
              />
              <SetupStepList
                steps={kycSteps}
                livenessRequired={kyc?.livenessRequired}
                kycTier={kyc?.kycTier}
                accountOwnershipType={kyc?.accountOwnershipType}
              />
              {renderSetupStep()}
            </ScrollView>
          </View>
          <AppToast />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default WalletScreen;
