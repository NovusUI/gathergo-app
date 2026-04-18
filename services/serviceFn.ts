import client from "@/api/client";
import {
  CompleteProfileData,
  ForgotPasswordPayload,
  forgotPasswordResponse,
  ResendEmailVerificationPayload,
  resendEmailVerificationResponse,
  EventsResponse,
  PhoneFirebaseAuthPayload,
  ResetPasswordPayload,
  resetPasswordResponse,
  StandardResponse,
  authResponse,
  checkUsernameRes,
  signUpResponse,
  publicProfileRes,
  uploadProfilePictureRes,
  VerifyEmailCodePayload,
  verifyEmailResponse,
} from "@/types/auth";
import {
  CarpoolForm,
  PaginatedEventCarpoolsResponse,
} from "@/types/carpool";
import {
  DonationResponse,
  EventDetailsResponse,
  OwnedRegistrationsResponse,
  OwnedTicketsResponse,
  GetTicketsResponse,
  InitiateDonationPayload,
  PaginatedDashboardEventsResponse,
  PaginatedEventResponse,
  PaginatedSeachResponse,
  RegistrationCheckoutPayload,
  TicketCheckoutPayload,
} from "@/types/event";
import { HomeAdCardsResponse } from "@/types/home";
import {
  NotifyOnKycResolutionResponse,
  NotifyOnKycResolutionPayload,
  StartBusinessKycPayload,
  StartBusinessRepresentativeKycPayload,
  StartPersonalKycPayload,
  SubmitWalletLivenessPayload,
  UpsertWalletPayoutProfilePayload,
  WalletBanksResponse,
  WalletKycResponse,
  WalletOnboardingResponse,
  WalletOverviewResponse,
  WalletPayoutProfileResponse,
} from "@/types/wallet";
import { QueryFunctionContext } from "@tanstack/react-query";

import { uploadClient } from "@/api/uploadClient";
import {
  BulkScanResponse,
  ScanHistoryResponse,
  ScanResponse,
  ScannerPermissionResponse,
  ScannerStatsResponse,
  SearchUsersResponse,
  ValidationResponse,
} from "@/types/scanner";
import {
  AUTH_URLS,
  CARPOOL_URL,
  DASHBOARD_URL,
  DONATION_URL,
  EVENT_URL,
  NOTIFICATION_URL,
  REGISTRATION_URL,
  SCANNER_URL,
  SEARCH_URL,
  TICKET_URL,
  TRANSACTION_URL,
  USER_URL,
  WALLET_URL,
} from "./urls";

export interface SignUpPayload {
  email: string;
  password: string;
}

export const loginFn = async (payload: {
  email: string;
  password: string;
}): Promise<authResponse> => {
  const { data } = await client.post<authResponse>(AUTH_URLS.login, payload);
  return data; // should return your UserResponse
};

export const googleLoginFn = async (
  googleToken: string
): Promise<authResponse> => {
  const { data } = await client.post<authResponse>(AUTH_URLS.googleLogin, {
    token: googleToken,
  });
  return data; // should match UserResponse
};

export const phoneFirebaseAuthFn = async (
  payload: PhoneFirebaseAuthPayload
): Promise<authResponse> => {
  const { data } = await client.post<authResponse>(
    AUTH_URLS.phoneFirebaseToken,
    payload
  );
  return data;
};

export const signUpFn = async (
  payload: SignUpPayload
): Promise<signUpResponse> => {
  const { data } = await client.post<signUpResponse>(AUTH_URLS.signup, payload);
  return data;
};

export const verifyEmailCodeFn = async (
  payload: VerifyEmailCodePayload
): Promise<verifyEmailResponse> => {
  const { data } = await client.post<verifyEmailResponse>(
    AUTH_URLS.verifyEmail,
    payload
  );
  return data;
};

export const resendEmailVerificationCodeFn = async (
  payload: ResendEmailVerificationPayload
): Promise<resendEmailVerificationResponse> => {
  const { data } = await client.post<resendEmailVerificationResponse>(
    AUTH_URLS.resendEmailVerification,
    payload
  );
  return data;
};

export const forgotPasswordFn = async (
  payload: ForgotPasswordPayload
): Promise<forgotPasswordResponse> => {
  const { data } = await client.post<forgotPasswordResponse>(
    AUTH_URLS.forgotPassword,
    payload
  );
  return data;
};

export const resetPasswordFn = async (
  payload: ResetPasswordPayload
): Promise<resetPasswordResponse> => {
  const { data } = await client.post<resetPasswordResponse>(
    AUTH_URLS.resetPassword,
    payload
  );
  return data;
};

export const updatePreference = async (
  preferences: string[]
): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(USER_URL.preference, {
    interests: preferences,
    eventTypes: [],
  });
  return response.data;
};

export const logoutFn = async () => {
  const res = await client.post(AUTH_URLS.logout);
  return res.data;
};

export const getCurrentUserFn = async () => {
  const res = await client.get(AUTH_URLS.me);
  return res.data;
};

export const getWalletOverviewFn = async (): Promise<WalletOverviewResponse> => {
  const response = await client.get<WalletOverviewResponse>(WALLET_URL.overview);
  return response.data;
};

export const getWalletOnboardingFn = async (): Promise<WalletOnboardingResponse> => {
  const response = await client.get<WalletOnboardingResponse>(WALLET_URL.onboarding);
  return response.data;
};

export const getWalletKycFn = async (): Promise<WalletKycResponse> => {
  const response = await client.get<WalletKycResponse>(WALLET_URL.kyc);
  return response.data;
};

export const getWalletBanksFn = async (): Promise<WalletBanksResponse> => {
  const response = await client.get<WalletBanksResponse>(WALLET_URL.banks);
  return response.data;
};

export const upsertWalletPayoutProfileFn = async (
  payload: UpsertWalletPayoutProfilePayload
): Promise<WalletPayoutProfileResponse> => {
  const response = await client.post<WalletPayoutProfileResponse>(
    WALLET_URL.payoutProfile,
    payload
  );
  return response.data;
};

export const startPersonalKycFn = async (
  payload: StartPersonalKycPayload
): Promise<WalletKycResponse> => {
  const response = await client.post<WalletKycResponse>(
    WALLET_URL.personalKycStart,
    payload
  );
  return response.data;
};

export const submitWalletLivenessFn = async (
  payload: SubmitWalletLivenessPayload
): Promise<WalletKycResponse> => {
  const response = await client.post<WalletKycResponse>(
    WALLET_URL.personalKycLiveness,
    payload
  );
  return response.data;
};

export const startBusinessKycFn = async (
  payload: StartBusinessKycPayload
): Promise<WalletKycResponse> => {
  const response = await client.post<WalletKycResponse>(
    WALLET_URL.businessKycStart,
    payload
  );
  return response.data;
};

export const startBusinessRepresentativeKycFn = async (
  payload: StartBusinessRepresentativeKycPayload
): Promise<WalletKycResponse> => {
  const response = await client.post<WalletKycResponse>(
    WALLET_URL.businessRepresentativeKycStart,
    payload
  );
  return response.data;
};

export const notifyOnKycResolutionFn = async (
  payload: NotifyOnKycResolutionPayload
): Promise<NotifyOnKycResolutionResponse> => {
  const response = await client.post<NotifyOnKycResolutionResponse>(
    WALLET_URL.notifyOnKycResolution,
    payload
  );
  return response.data;
};

export const submitWalletKycFn = async (): Promise<WalletKycResponse> => {
  const response = await client.post<WalletKycResponse>(
    WALLET_URL.submitKyc,
    { confirm: true }
  );
  return response.data;
};


export const getUserProfile = async (
  ctx: QueryFunctionContext
): Promise<publicProfileRes> => {
  const [, userId] = ctx.queryKey as [string, string | undefined];

  if (!userId) {
    throw new Error("User ID is required");
  }

  const response = await client.get<publicProfileRes>(
    USER_URL.getPublicProfle(userId)
  );

  return response.data;
};

export const checkUsernameExists = async (
  username: string
): Promise<checkUsernameRes> => {
  const response = await client.post<checkUsernameRes>(USER_URL.checkUsername, {
    username,
  });
  // Assume API returns { exists: true/false }
  return response.data;
};

export const completUserProfile = async (
  payload: CompleteProfileData
): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(
    USER_URL.completeProfile,
    payload
  );
  // Assume API returns { exists: true/false }
  return response.data;
};

export const edtUserBio = async (payload: {
  bio: string;
}): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(
    USER_URL.editUserBio,
    payload
  );
  // Assume API returns { exists: true/false }
  return response.data;
};

// export const uploadPicture = async (
//   formData: FormData
// ): Promise<uploadProfilePictureRes> => {
//   const response = await client.post<uploadProfilePictureRes>(
//     USER_URL.profilePictureUpload,
//     formData
//   );

//   return response.data;
// };

export const uploadPicture = async (
  formData: FormData
): Promise<uploadProfilePictureRes> => {
  // Use fetch client instead of axios
  const data = await uploadClient.upload("/user/profile-picture", formData);
  return data;
};

// export const createEvent = async (
//   formData: FormData
// ): Promise<StandardResponse> => {
//   const response = await client.post<StandardResponse>(
//     EVENT_URL.createEvent,
//     formData
//   );

//   return response.data;
// };

export const createEvent = async (
  formData: FormData
): Promise<StandardResponse> => {
  // Use fetch client instead of axios
  const data = await uploadClient.upload(EVENT_URL.createEvent, formData);
  return data;
};

// export const updateEvent = async (
//   formData: FormData,
//   eventId: string
// ): Promise<StandardResponse> => {
//   const response = await client.patch<StandardResponse>(
//     EVENT_URL.updateEvent(eventId),
//     formData
//   );

//   return response.data;
// };

export const updateEvent = async (
  formData: FormData,
  eventId: string
): Promise<StandardResponse> => {
  // Use fetch client instead of axios
  const data = await uploadClient.upload(
    EVENT_URL.updateEvent(eventId),
    formData,
    { method: "PATCH" }
  );
  return data;
};

export const getEventsForYou = async (): Promise<EventsResponse> => {
  const response = await client.get<EventsResponse>(EVENT_URL.getForyouEvents);
  return response.data;
};

export const getEventDetails = async (
  ctx: QueryFunctionContext
): Promise<EventDetailsResponse> => {
  const [, eventId] = ctx.queryKey as [string, string];

  const response = await client.get<EventDetailsResponse>(
    EVENT_URL.getEventDetails(eventId)
  );

  return response.data;
};

export const getTransactionRef = async (
  ctx: QueryFunctionContext
): Promise<StandardResponse> => {
  const [, tId] = ctx.queryKey as [string, string];

  const response = await client.get<StandardResponse>(
    TRANSACTION_URL.getTransactionRef(tId)
  );

  return response.data;
};

export const getTicketOrRegByTransactionId = async (
  ctx: QueryFunctionContext
): Promise<StandardResponse> => {
  const [, tId, type] = ctx.queryKey as [string, string, string | undefined];

  const response = await client.get<StandardResponse>(
    TRANSACTION_URL.getTicketOrRegByTransactionId(tId),
    { params: { type } }
  );

  return response.data;
};

export const getMyTicketsFn = async (): Promise<OwnedTicketsResponse> => {
  const response = await client.get<OwnedTicketsResponse>(TICKET_URL.myTickets);
  return response.data;
};

export const getMyRegistrationsFn = async (): Promise<OwnedRegistrationsResponse> => {
  const response = await client.get<OwnedRegistrationsResponse>(
    REGISTRATION_URL.myRegistrations
  );
  return response.data;
};

export const getTickets = async (
  payload: TicketCheckoutPayload
): Promise<GetTicketsResponse> => {
  const response = await client.post<GetTicketsResponse>(
    EVENT_URL.getTickets,
    {
      items: payload.items,
      provider: payload.provider,
      clientContext: payload.clientContext,
    }
  );
  return response.data;
};

export const registerForEvent = async (
  payload: RegistrationCheckoutPayload
): Promise<GetTicketsResponse> => {
  const response = await client.post<GetTicketsResponse>(
    EVENT_URL.registerEvent,
    {},
    {
      params: {
        eventid: payload.eventId,
        provider: payload.provider,
        deviceId: payload.deviceId,
        platform: payload.platform,
        beneficiaryType: payload.beneficiaryType,
        sponsorshipNote: payload.sponsorshipNote,
      },
    }
  );
  return response.data;
};

export const initiateDonation = async (
  payload: InitiateDonationPayload
): Promise<DonationResponse> => {
  const response = await client.post<DonationResponse>(
    DONATION_URL.initiateDonation,
    payload
  );
  return response.data;
};

export const getAllUserEvent = async (
  ctx: QueryFunctionContext<[string, string | undefined, number]>
): Promise<PaginatedEventResponse> => {
  const [, userId, pageSize] = ctx.queryKey;
  const page = (ctx.pageParam as number) ?? 1;

  const response = await client.get<PaginatedEventResponse>(
    EVENT_URL.getUserEvents,
    {
      params: { userId, page, pageSize },
    }
  );
  console.log(response.data);
  return response.data;
};

export const getSearchResult = async (
  ctx: QueryFunctionContext<
    [string, string, "events" | "communities" | "users", number]
  >
): Promise<PaginatedSeachResponse> => {
  const [, query, type, pageSize] = ctx.queryKey;
  const page = (ctx.pageParam as number) ?? 1;

  const response = await client.get<PaginatedSeachResponse>(
    SEARCH_URL.getSearchResult,
    {
      params: { query, page, type, pageSize },
    }
  );
  console.log(response.data);
  return response.data;
};

export const createCarpool = async (
  payload: CarpoolForm
): Promise<StandardResponse> => {
  const response = await client.post<StandardResponse>(
    CARPOOL_URL.createCarpool,
    payload
  );
  // Assume API returns { exists: true/false }
  return response.data;
};

export const getCarpoolDetails = async (
  ctx: QueryFunctionContext
): Promise<StandardResponse> => {
  const [, id] = ctx.queryKey as [string, string];

  const response = await client.get<StandardResponse>(
    CARPOOL_URL.getCarpoolDetails(id)
  );

  return response.data;
};

export const getCarpoolsForYou = async (): Promise<StandardResponse> => {
  const response = await client.get<StandardResponse>(
    CARPOOL_URL.getForYouCarpool
  );

  return response.data;
};

export const getPaginatedEventCarpools = async (
  ctx: QueryFunctionContext<
    [
      string,
      {
        eventId: string;
        filter?: "all" | "close_to_you" | "followed";
        latitude?: number;
        longitude?: number;
        pageSize: number;
      },
    ]
  >
): Promise<PaginatedEventCarpoolsResponse> => {
  const [, payload] = ctx.queryKey;
  const page = (ctx.pageParam as number) ?? 1;

  const response = await client.get<PaginatedEventCarpoolsResponse>(
    CARPOOL_URL.getPaginatedEventCarpools(payload.eventId),
    {
      params: {
        page,
        pageSize: payload.pageSize,
        filter: payload.filter ?? "all",
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    }
  );

  return response.data;
};

export const updateCarpool = async (
  carpoolData: any,
  carpoolId: string
): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(
    CARPOOL_URL.updateCarpool(carpoolId),
    carpoolData
  );

  return response.data;
};

export const requestCarpool = async (
  payload: any,
  carpoolId: string
): Promise<StandardResponse> => {
  const response = await client.post<StandardResponse>(
    CARPOOL_URL.requestCarpool(carpoolId),
    payload
  );
  // Assume API returns { exists: true/false }
  return response.data;
};

export const respondToCarpoolRequest = async (
  requestRes: "ACCEPTED" | "DECLINED",
  requestId: string
): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(
    CARPOOL_URL.respondToRequest(requestId),
    { action: requestRes }
  );

  return response.data;
};

export const removePassenger = async (
  requestId: string
): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(
    CARPOOL_URL.removePassenger(requestId),
    {}
  );

  return response.data;
};

export const leaveCarpool = async (
  carpoolId: string
): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(
    CARPOOL_URL.leaveCarpool(carpoolId),
    {}
  );

  return response.data;
};

export const followUser = async (payload: {
  followingId: string;
}): Promise<StandardResponse> => {
  const response = await client.post<StandardResponse>(
    USER_URL.followUser,
    payload
  );
  // Assume API returns { exists: true/false }
  return response.data;
};

export const unfollowUser = async (
  userId: string
): Promise<StandardResponse> => {
  const response = await client.delete<StandardResponse>(
    USER_URL.unfollowUser(userId)
  );
  // Assume API returns { exists: true/false }
  return response.data;
};

export const registerPushToken = async (payload: {
  token: string;
  platform: string;
}): Promise<StandardResponse> => {
  console.log(payload.platform);
  const response = await client.post<StandardResponse>(
    NOTIFICATION_URL.registerPushToken,
    payload
  );

  return response.data;
};

export const removePushToken = async (payload: {
  token: string;
}): Promise<StandardResponse> => {
  const response = await client.post<StandardResponse>(
    NOTIFICATION_URL.removePushToken,
    payload
  );
  return response.data;
};

export const getCarpoolChatAccess = async (
  ctx: QueryFunctionContext
): Promise<StandardResponse> => {
  const [, carpoolId] = ctx.queryKey as [string, string];

  const response = await client.get<StandardResponse>(
    CARPOOL_URL.getCarpoolChatAccess(carpoolId)
  );

  return response.data;
};

export const getEventImageStatus = async (
  ctx: QueryFunctionContext
): Promise<StandardResponse> => {
  const [, eventId] = ctx.queryKey as [string, string];

  const response = await client.get<StandardResponse>(
    EVENT_URL.getEventImageUploadStatus(eventId)
  );

  return response.data;
};

export const requestCarpoolAfterCancel = async (
  payload: {
    cancelCarpoolId: string;
    origin: string;
    note?: string;
    startPoint?: { lng: number; lat: number };
  },
  carpoolId: string
): Promise<StandardResponse> => {
  const response = await client.post<StandardResponse>(
    CARPOOL_URL.requestCarpoolAfterCancel(carpoolId),
    payload
  );
  return response.data;
};

export const getDashboardData = async (): Promise<StandardResponse> => {
  const response = await client.get<StandardResponse>(
    DASHBOARD_URL.getDashboard
  );

  return response.data;
};

export const getHomeAdCards = async (): Promise<HomeAdCardsResponse> => {
  const response = await client.get<HomeAdCardsResponse>(
    DASHBOARD_URL.getHomeAdCards
  );

  return response.data;
};

export const getEventDashboardData = async (
  ctx: QueryFunctionContext
): Promise<StandardResponse> => {
  const [, eventId] = ctx.queryKey as [string, string];
  const response = await client.get<StandardResponse>(
    DASHBOARD_URL.getEventDashboard(eventId)
  );

  return response.data;
};

export const getDashboardEvents = async (
  ctx: QueryFunctionContext<[string, string | undefined, number]>
): Promise<PaginatedDashboardEventsResponse> => {
  const [, filter, pageSize] = ctx.queryKey;
  const page = (ctx.pageParam as number) ?? 1;

  const response = await client.get<PaginatedDashboardEventsResponse>(
    DASHBOARD_URL.getDashboardEvents,
    {
      params: { filter, page, pageSize },
    }
  );
  console.log(response.data);
  return response.data;
};

export const getPayments = async (
  ctx: QueryFunctionContext<[string, string | undefined, number]>
): Promise<PaginatedEventResponse> => {
  const [, eventId, pageSize] = ctx.queryKey;
  const page = (ctx.pageParam as number) ?? 1;

  const response = await client.get<PaginatedEventResponse>(
    DASHBOARD_URL.getPayments,
    {
      params: { eventId, page, pageSize },
    }
  );
  console.log(response.data);
  return response.data;
};

export const getShortcut = async (): Promise<StandardResponse> => {
  console.log("is it?");
  const response = await client.get<StandardResponse>(
    DASHBOARD_URL.getShortcut
  );

  console.log("returning data");

  return response.data;
};

export const getShortcutEvent = async (
  ctx: QueryFunctionContext
): Promise<StandardResponse> => {
  const [, eventId] = ctx.queryKey as [string, string];
  const response = await client.get<StandardResponse>(
    DASHBOARD_URL.getShortcutEvent(eventId)
  );

  return response.data;
};

export const quickScanFn = async (
  qrCode: string
): Promise<ValidationResponse> => {
  const response = await client.get<ValidationResponse>(SCANNER_URL.quickScan, {
    params: { qrCode },
  });
  return response.data;
};

export const scanFn = async (payload: {
  qrCode: string;
  markAsUsed?: boolean;
  location?: string;
  notes?: string;
}): Promise<ScanResponse> => {
  console.log(payload, "scan pl");
  const response = await client.post<ScanResponse>(SCANNER_URL.scan, payload);
  return response.data;
};

export const bulkScanFn = async (payload: {
  scans: Array<{ qrCode: string; markAsUsed?: boolean }>;
}): Promise<BulkScanResponse> => {
  const response = await client.post<BulkScanResponse>(
    SCANNER_URL.bulkScan,
    payload
  );
  return response.data;
};

export const validateScanFn = async (
  qrCode: string
): Promise<ValidationResponse> => {
  const response = await client.get<ValidationResponse>(
    SCANNER_URL.validate(qrCode)
  );
  return response.data;
};

export const getScanHistoryFn = async (
  ctx: QueryFunctionContext<[string, any]>
): Promise<ScanHistoryResponse> => {
  const [, filters] = ctx.queryKey;
  const page = (ctx.pageParam as number) ?? 1;

  const response = await client.get<ScanHistoryResponse>(
    SCANNER_URL.scanHistory,
    { params: { ...filters, page } }
  );
  return response.data;
};

export const getScannerStatsFn = async (): Promise<ScannerStatsResponse> => {
  const response = await client.get<ScannerStatsResponse>(
    SCANNER_URL.scannerStats
  );
  return response.data;
};

// Scanner permissions functions
export const grantScannerPermissionFn = async (payload: {
  scannerId?: string;
  userEmail?: string;

  expiresAt?: string;
}): Promise<ScannerPermissionResponse> => {
  const response = await client.post<ScannerPermissionResponse>(
    SCANNER_URL.grantPermission,
    payload
  );
  return response.data;
};

export const updateScannerPermissionFn = async (
  permissionId: string,
  payload: { isActive?: boolean; expiresAt?: string }
): Promise<ScannerPermissionResponse> => {
  const response = await client.patch<ScannerPermissionResponse>(
    SCANNER_URL.updatePermission(permissionId),
    payload
  );
  return response.data;
};

export const revokeScannerPermissionFn = async (
  permissionId: string
): Promise<StandardResponse> => {
  const response = await client.delete<StandardResponse>(
    SCANNER_URL.revokePermission(permissionId)
  );
  return response.data;
};

export const getGrantedScannerPermissionsFn = async (): Promise<ScannerPermissionResponse> => {
  const response = await client.get<ScannerPermissionResponse>(
    SCANNER_URL.grantedPermissions
  );
  return response.data;
};

export const getMyScannerPermissionsFn =
  async (): Promise<ScannerPermissionResponse> => {
    const response = await client.get<ScannerPermissionResponse>(
      SCANNER_URL.myPermissions
    );
    return response.data;
  };

export const searchScannerUsersFn = async (
  ctx: QueryFunctionContext<[string, any]>
): Promise<SearchUsersResponse> => {
  const [, query] = ctx.queryKey;
  const page = (ctx.pageParam as number) ?? 1;

  const response = await client.get<SearchUsersResponse>(
    SCANNER_URL.searchUsers,
    { params: { ...query, page } }
  );
  return response.data;
};

export const canScanFn = async (
  eventId: string
): Promise<{ canScan: boolean; canMarkAsUsed: boolean }> => {
  const response = await client.get<{
    canScan: boolean;
    canMarkAsUsed: boolean;
  }>(SCANNER_URL.canScan(eventId));
  return response.data;
};
