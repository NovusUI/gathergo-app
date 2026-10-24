import {
  DashboardEventResponse,
  EventData,
  Registration,
  StandardResponse,
} from "./auth";
import type { VolunteerApplication, VolunteerRoleWithCount } from "./volunteer";

export enum searchTypes {
  EVENTS = "events",
  USERS = "users",
  communities = "communites",
}

interface paginatedResponse extends StandardResponse {
  meta: { total: number; page: number; pageSize: number; hasNextPage: boolean };
}

export type PaymentProvider = "PAYSTACK" | "ALAT_TRANSFER";
export type FeeBearer = "BUYER" | "CREATOR" | "PLATFORM";

export type EventTicket = {
  id: string;
  type: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  perks: string[];
  isVisible: boolean;
  updatedPrice: number | null;
};

export interface EventTicketResponse
  extends Pick<StandardResponse, "status" | "message"> {
  data: EventTicket;
}

export interface CheckoutPricingRule {
  percentageBps: number;
  fixedFeeKobo: number;
  fixedFeeWaiverBelowKobo: number | null;
  capKobo: number | null;
  appliesTo: string;
  available: boolean;
}

export interface CheckoutPricingConfig {
  currency: string;
  minorUnit: string;
  feeBearers: {
    providerFee: FeeBearer;
    platformFee: FeeBearer;
    settlementFee: FeeBearer;
  };
  buyerTotalMayVaryByProvider: boolean;
  platformFee: {
    percentageBps: number;
    fixedFeeKobo: number;
    capKobo: number | null;
    appliesTo: string;
  };
  providers: Record<PaymentProvider, CheckoutPricingRule>;
  settlement: {
    includedInCheckout: boolean;
    note: string;
  };
}

export interface EventPaymentOptions {
  maxTicketsPerCheckout: number;
  reservationSeconds: number;
  requiresPayment: boolean;
  acceptsDonations: boolean;
  supportsPaystack: boolean;
  supportsAlatTransfer: boolean;
  availableProviders: PaymentProvider[];
  alatTransferDisplayName?: string | null;
  alatTransferUnavailableReason?: string | null;
  pricingConfig: CheckoutPricingConfig;
}

export interface CheckoutPricingSummary {
  grossAmountKobo: number;
  grossAmountNaira: number;
  chargeAmountKobo: number;
  chargeAmountNaira: number;
  buyerFeeTotalKobo: number;
  buyerFeeTotalNaira: number;
  buyerProviderFeeKobo: number;
  buyerPlatformFeeKobo: number;
  providerFeeKobo: number;
  platformFeeKobo: number;
  creatorPayableKobo: number;
  creatorPayableNaira: number;
}

export interface PaymentInstructions {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  subaccountReference?: string | null;
  reference?: string | null;
  amountKobo?: number | null;
  amountInNaira?: number | null;
  narration?: string | null;
  expiresAt?: string | null;
}

export interface EventImpactReportOutcome {
  id?: string;
  type: string;
  label: string;
  value: number;
  unit: string;
  note?: string;
}

export interface EventImpactReport {
  id: string;
  eventId: string;
  creatorId: string;
  summary: string;
  outcomes: EventImpactReportOutcome[];
  evidenceLinks: string[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertEventImpactReportPayload {
  summary: string;
  outcomes: EventImpactReportOutcome[];
  evidenceLinks?: string[];
}

export interface PaginatedEventResponse extends paginatedResponse {
  data: EventData[];
}

export interface PaginatedDashboardEventsResponse extends paginatedResponse {
  data: DashboardEventResponse[];
}

export interface PaginatedSeachResponse extends paginatedResponse {
  data: EventData[] | { id: string }[];
}

export interface EventDetails extends EventData {
  volunteerRoles: VolunteerRoleWithCount[];
  volunteers: VolunteerApplication[];
  eventTickets: EventTicket[];
  paymentOptions: EventPaymentOptions;
  impactReport?: EventImpactReport | null;
}

export interface EventDetailsResponse extends StandardResponse {
  data: EventDetails;
}

export interface OwnedAccessEventSummary {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  registrationType: Registration;
  isPhysicalEvent: boolean;
}

export interface OwnedTicket {
  id: string;
  status: string;
  createdAt: string;
  qrCode: string;
  isUsed: boolean;
  transactionId: string;
  eventTicket: {
    id: string;
    type: string;
    price: number;
    updatedPrice: number | null;
    event: OwnedAccessEventSummary;
  };
}

export interface OwnedRegistration {
  id: string;
  status: string;
  createdAt: string;
  qrCode: string;
  isUsed: boolean;
  transactionId: string;
  eventId: string;
  event: OwnedAccessEventSummary;
}

export interface OwnedTicketsResponse extends StandardResponse {
  data: OwnedTicket[];
}

export interface OwnedRegistrationsResponse extends StandardResponse {
  data: OwnedRegistration[];
}

export interface GetTickets {
  id: string;
  quantity: number;
  ticketName: string;
}

export interface TicketCheckoutPayload {
  idempotencyKey: string;
  items: GetTickets[];
  provider?: PaymentProvider;
  clientContext?: {
    deviceId?: string;
    platform?: string;
  };
}

export interface RegistrationCheckoutPayload {
  idempotencyKey: string;
  eventId: string;
  provider?: PaymentProvider;
  deviceId?: string;
  platform?: string;
}

export interface CheckoutApiResponse extends Omit<StandardResponse, "status_code"> {
  data: {
    checkoutStatus:
      | "PENDING"
      | "AWAITING_TRANSFER"
      | "SUCCESS"
      | "EXPIRED"
      | "FAILED"
      | "REFUND_REQUIRED"
      | "REFUNDED";
    initializationStatus: "NOT_STARTED" | "INITIALIZING" | "READY" | "FAILED";
    reservationStatus: "HELD" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | null;
    reservationExpiresAt: string | null;
    serverTime: string;
    maxTicketsPerCheckout: number;
    message: string;
    transactionId: string;
    paymentProvider: PaymentProvider;
    paymentUrl: string | null;
    paymentInstructions: PaymentInstructions | null;
    unavailableTickets: never[];
    freeTickets: (Omit<GetTickets, "id"> & { eventTicketId: string })[];
    totalAmount: number;
    totalAmountKobo: number;
    pricing: CheckoutPricingSummary;
    riskStatus: string;
    settlementStatus: string;
  };
}

export type GetTicketsResponse = Omit<CheckoutApiResponse, "data"> & {
  data: CheckoutApiResponse["data"] & { checkoutDeadlineMs: number | null };
};

export interface InitiateDonationPayload {
  eventId: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
  provider?: PaymentProvider;
  clientContext?: {
    deviceId?: string;
    platform?: string;
  };
}

export interface DonationResponse extends StandardResponse {
  data: {
    message: string;
    status: string;
    transactionId: string;
    paymentProvider: PaymentProvider;
    paymentUrl: string | null;
    paymentInstructions?: PaymentInstructions | null;
    totalAmount: number;
    totalAmountKobo?: number;
    amountInNaira: number;
    pricing?: CheckoutPricingSummary;
    settlementStatus?: string;
    riskStatus?: string;
    event: {
      id: string;
      title: string;
    };
  };
}

export type TransactionStatusApiResponse = Omit<StandardResponse, "data" | "status_code"> & {
  data: {
    id: string;
    status: GetTicketsResponse["data"]["checkoutStatus"];
    paymentProvider: PaymentProvider;
    amount: number;
    metadata: {
      type: "TICKET" | "REGISTRATION" | "DONATION";
      eventId: string;
      eventTitle: string;
      providerInstructions?: PaymentInstructions | null;
    };
  } & (
    | ({ paymentType: "TICKET" | "REGISTRATION" | null } & Pick<
        GetTicketsResponse["data"],
        | "paymentUrl"
        | "reservationExpiresAt"
        | "serverTime"
        | "initializationStatus"
      >)
    | {
        paymentType: "DONATION";
        paymentUrl?: never;
        reservationExpiresAt?: never;
        serverTime?: never;
        initializationStatus?: never;
      }
  );
};

export type TransactionStatusResponse = Omit<TransactionStatusApiResponse, "data"> & {
  data: TransactionStatusApiResponse["data"] & { checkoutDeadlineMs: number | null };
};
