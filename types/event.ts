import { DashboardEventResponse, EventData, StandardResponse } from "./auth";

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
  requiresPayment: boolean;
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

export interface PaginatedEventResponse extends paginatedResponse {
  data: Event[];
}

export interface PaginatedDashboardEventsResponse extends paginatedResponse {
  data: DashboardEventResponse[];
}

export interface PaginatedSeachResponse extends paginatedResponse {
  data: EventData[] | { id: string }[];
}

export interface EventDetails extends EventData {
  eventTickets?: EventTicket[];
  paymentOptions?: EventPaymentOptions;
  sponsoredRegistrationsCount?: number;
  sponsoredRegistrationsAvailable?: number;
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
  items: GetTickets[];
  provider?: PaymentProvider;
  clientContext?: {
    deviceId?: string;
    platform?: string;
  };
}

export interface RegistrationCheckoutPayload {
  eventId: string;
  provider?: PaymentProvider;
  deviceId?: string;
  platform?: string;
  beneficiaryType?: "SELF" | "SPONSORED";
  sponsorshipNote?: string;
}

export interface GetTicketsResponse extends StandardResponse {
  data: {
    message: string;
    transactionId: string;
    paymentProvider: PaymentProvider;
    paymentUrl: string | null;
    paymentInstructions?: PaymentInstructions | null;
    unavailableTickets: any[];
    freeTickets: any[];
    totalAmount: number;
    totalAmountKobo?: number;
    pricing?: CheckoutPricingSummary;
    riskStatus?: string;
    settlementStatus?: string;
  };
}

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
