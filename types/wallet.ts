import { StandardResponse } from "./auth";

export type AccountOwnershipType = "UNKNOWN" | "PERSONAL" | "BUSINESS";
export type CreatorPayoutProfileStatus =
  | "NOT_STARTED"
  | "ACCOUNT_PROVIDED"
  | "ACCOUNT_VERIFIED"
  | "PENDING_KYC"
  | "REVIEW_REQUIRED"
  | "ACTIVE"
  | "REJECTED"
  | "RESTRICTED";
export type CreatorAlatProfileStatus =
  | "NOT_STARTED"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "INACTIVE"
  | "REJECTED";
export type KycVerificationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_PROVIDER"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export type KycVerificationMode =
  | "PERSONAL_NIN"
  | "PERSONAL_VNIN"
  | "PERSONAL_PASSPORT"
  | "PERSONAL_PHONE_NIN"
  | "BUSINESS_CAC_REP_NIN"
  | "BUSINESS_CAC_REP_VNIN"
  | "BUSINESS_CAC_REP_PASSPORT"
  | "BUSINESS_CAC_REP_PHONE_NIN";
export type NameMatchStatus =
  | "NOT_CHECKED"
  | "MATCHED"
  | "REVIEW_REQUIRED"
  | "MISMATCH";

export interface WalletBalance {
  heldBalance: number;
  availableBalance: number;
  processingBalance: number;
  settledBalance: number;
  totalCollected: number;
  currency: string;
}

export interface CreatorPayoutProfile {
  status: CreatorPayoutProfileStatus;
  accountOwnershipType: AccountOwnershipType;
  businessName?: string | null;
  legalName?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  accountName?: string | null;
  accountNumberMasked?: string | null;
  accountNumber?: string | null;
  bvnLast4?: string | null;
  kycStatus: KycVerificationStatus;
  nameMatchStatus: NameMatchStatus;
  accountVerifiedAt?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
}

export interface CreatorAlatProfile {
  status: CreatorAlatProfileStatus;
  displayName?: string | null;
  subaccountReference?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  activatedAt?: string | null;
  notes?: string | null;
}

export interface WalletTransaction {
  id: string;
  paymentType: "TICKET" | "REGISTRATION" | "DONATION";
  paymentProvider: "PAYSTACK" | "ALAT_TRANSFER";
  grossAmount: number;
  platformFee: number;
  providerFee: number;
  creatorPayable: number;
  settlementStatus:
    | "NOT_READY"
    | "HELD_KYC"
    | "HELD_RISK"
    | "READY"
    | "PROCESSING"
    | "SETTLED"
    | "FAILED";
  riskStatus: "CLEAR" | "REVIEW" | "HOLD" | "BLOCKED";
  riskScore: number;
  eventTitle?: string | null;
  buyerUsername?: string | null;
  createdAt: string;
}

export interface WalletSettlement {
  id: string;
  reference: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED";
  destinationBankName?: string | null;
  destinationAccountName?: string | null;
  destinationAccountNumber?: string | null;
  transactionCount: number;
  createdAt: string;
  processedAt?: string | null;
}

export interface WalletOverviewData {
  balance: WalletBalance;
  payoutProfile: CreatorPayoutProfile | null;
  alatProfile: CreatorAlatProfile | null;
  recentTransactions: WalletTransaction[];
  recentSettlements: WalletSettlement[];
}

export interface WalletOnboardingTask {
  code: string;
  title: string;
  status: string;
  blocking: boolean;
}

export interface WalletOnboardingData {
  hasPaidEvent: boolean;
  needsAttention: boolean;
  showPersistentAlert: boolean;
  nextAction?: string | null;
  canReceiveSettlement: boolean;
  canOfferAlatTransfer: boolean;
  tasks: WalletOnboardingTask[];
  payoutProfileStatus: CreatorPayoutProfileStatus;
  kycStatus: KycVerificationStatus;
  alatProfileStatus: CreatorAlatProfileStatus;
}

export interface WalletKycStep {
  code: string;
  status: string;
}

export interface WalletKycData {
  status: KycVerificationStatus;
  accountOwnershipType: AccountOwnershipType;
  verificationMode?: KycVerificationMode | null;
  steps: WalletKycStep[];
  businessStatus: KycVerificationStatus;
  identityStatus: KycVerificationStatus;
  livenessStatus: KycVerificationStatus;
  amlStatus: KycVerificationStatus;
  dedupStatus: KycVerificationStatus;
  nameMatchStatus: NameMatchStatus;
  verifiedFullName?: string | null;
  verifiedBusinessName?: string | null;
  rejectionReason?: string | null;
}

export interface WalletBank {
  name?: string | null;
  code?: string | null;
  longcode?: string | null;
}

export interface WalletOverviewResponse extends StandardResponse {
  data: WalletOverviewData;
}

export interface WalletOnboardingResponse extends StandardResponse {
  data: WalletOnboardingData;
}

export interface WalletKycResponse extends StandardResponse {
  data: WalletKycData;
}

export interface WalletBanksResponse extends StandardResponse {
  data: WalletBank[];
}

export interface WalletPayoutProfileResponse extends StandardResponse {
  data: CreatorPayoutProfile;
}

export interface UpsertWalletPayoutProfilePayload {
  accountOwnershipType: AccountOwnershipType;
  businessName?: string;
  legalName?: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName?: string;
  bvnLast4?: string;
}

export interface StartPersonalKycPayload {
  verificationMode?: KycVerificationMode;
  phoneNumber?: string;
  nin?: string;
  vnin?: string;
  passportNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export interface StartBusinessKycPayload {
  regNumber: string;
  businessName?: string;
}

export interface StartBusinessRepresentativeKycPayload {
  verificationMode?: KycVerificationMode;
  representativePhoneNumber?: string;
  representativeFirstName?: string;
  representativeLastName?: string;
  representativeDateOfBirth?: string;
  representativeNin?: string;
  representativeVnin?: string;
  representativePassportNumber?: string;
}

export interface SubmitWalletLivenessPayload {
  imageUrl?: string;
  identityNumber?: string;
  photoBase64?: string;
}

export type NotifyOnKycResolutionTarget =
  | "BUSINESS"
  | "IDENTITY"
  | "LIVENESS";

export interface NotifyOnKycResolutionPayload {
  target: NotifyOnKycResolutionTarget;
}

export interface NotifyOnKycResolutionData {
  queued: boolean;
  sent: boolean;
  target: NotifyOnKycResolutionTarget;
  currentStatus: KycVerificationStatus;
}

export interface NotifyOnKycResolutionResponse extends StandardResponse {
  data: NotifyOnKycResolutionData;
}
