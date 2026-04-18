import { API_BASE_URL } from "@/constants/network";

const base_url = API_BASE_URL;

export const AUTH_URLS = {
  login: base_url + "/auth/login",
  signup: base_url + "/auth/signup",
  verifyEmail: base_url + "/auth/verify-email",
  resendEmailVerification: base_url + "/auth/resend-email-verification",
  forgotPassword: base_url + "/auth/forgot-password",
  resetPassword: base_url + "/auth/reset-password",
  googleLogin: base_url + "/auth/google",
  phoneFirebaseToken: base_url + "/auth/phone/firebase-token",
  logout: "/auth/logout",
  me: "/auth/me", // get current user
};

export const USER_URL = {
  preference: "/preferences",
  getPublicProfle: (userId: string) => base_url + `/user/public/${userId}`,
  checkUsername: base_url + "/auth/verify-username",
  completeProfile: base_url + "/user/complete-profile",
  editUserBio: base_url + "/user/edit-bio",
  profilePictureUpload: base_url + "/user/profile-picture",
  followUser: base_url + `/follow/user`,
  unfollowUser: (userId: string) => base_url + `/follow/user/${userId}`,
};

export const EVENT_URL = {
  createEvent: base_url + "/events",
  updateEvent: (eventId: string) => base_url + `/events/${eventId}`,
  getForyouEvents: base_url + "/events/for-you",
  getEventDetails: (eventId: string) => base_url + `/events/${eventId}`,
  getTickets: base_url + "/transaction-reference/initiate",
  registerEvent: base_url + `/transaction-reference/initiateReg`,
  getUserEvents: base_url + "/events",
  getEventImageUploadStatus: (eventId: string) =>
    base_url + `/events/${eventId}/image-status`,
};

export const TRANSACTION_URL = {
  getTransactionRef: (id: string) =>
    base_url + `/transaction-reference/status/${id}`,
  getTicketOrRegByTransactionId: (id: string) =>
    base_url + `/transaction-reference/ticketorreg/${id}`,
};

export const TICKET_URL = {
  myTickets: base_url + "/tickets/my-tickets",
};

export const REGISTRATION_URL = {
  myRegistrations: base_url + "/registrations/my",
};

export const SEARCH_URL = {
  getSearchResult: base_url + "/search",
};

export const CARPOOL_URL = {
  createCarpool: base_url + "/carpool",
  getCarpoolDetails: (id: string) => base_url + `/carpool/${id}`,
  getPaginatedEventCarpools: (eventId: string) =>
    base_url + `/carpool/event/${eventId}/paginated`,
  getCarpoolChatAccess: (id: string) => base_url + `/carpool/${id}/chat-access`,
  getForYouCarpool: base_url + "/carpool/for-you",
  updateCarpool: (carpoolId: string) => base_url + `/carpool/${carpoolId}`,
  requestCarpool: (carpoolId: string) =>
    base_url + `/carpool/${carpoolId}/request/`,
  respondToRequest: (requestId: string) =>
    base_url + `/carpool/passenger/${requestId}/respond`,
  removePassenger: (requestId: string) =>
    base_url + `/carpool/passenger/remove/${requestId}`,
  leaveCarpool: (carpoolId: string) => base_url + `/carpool/leave/${carpoolId}`,
  requestCarpoolAfterCancel: (carpoolId: string) =>
    `/carpool/${carpoolId}/request-after-cancel`,
};

export const NOTIFICATION_URL = {
  registerPushToken: base_url + "/backgroundnotifications/registertoken",
  removePushToken: base_url + "/backgroundnotifications/removetoken",
};

export const DONATION_URL = {
  initiateDonation: base_url + "/transaction-reference/initiateDonation",
};

export const WALLET_URL = {
  overview: base_url + "/wallet/overview",
  onboarding: base_url + "/wallet/onboarding",
  payoutProfile: base_url + "/wallet/payout-profile",
  banks: base_url + "/wallet/banks",
  kyc: base_url + "/wallet/kyc",
  personalKycStart: base_url + "/wallet/kyc/personal/start",
  personalKycLiveness: base_url + "/wallet/kyc/personal/liveness",
  businessKycStart: base_url + "/wallet/kyc/business/start",
  businessRepresentativeKycStart: base_url + "/wallet/kyc/business/representative",
  notifyOnKycResolution: base_url + "/wallet/kyc/notify-on-resolution",
  submitKyc: base_url + "/wallet/kyc/submit",
};

export const DASHBOARD_URL = {
  getDashboard: base_url + "/dashboard/overview",
  getHomeAdCards: base_url + "/dashboard/home-cards",
  getEventDashboard: (eventId: string) =>
    base_url + `/dashboard/event/${eventId}`,
  getDashboardEvents: base_url + `/dashboard/dashboardevents/list`,
  getPayments: base_url + "/dashboard/payments",
  getShortcut: base_url + "/dashboard/quick-access",
  getShortcutEvent: (eventId: string) =>
    base_url + `/dashboard/quick-access/event/${eventId}`,
};

export const SCANNER_URL = {
  // Scanner endpoints
  scan: base_url + "/scanner/scan",
  quickScan: base_url + "/scanner/quick-scan",
  bulkScan: base_url + "/scanner/scan/bulk",
  validate: (qrCode: string) => base_url + `/scanner/validate/${qrCode}`,
  scanHistory: base_url + "/scanner/history",
  scannerStats: base_url + "/scanner/stats",

  // Scanner permissions
  grantPermission: base_url + "/scanner-permissions/grant",
  updatePermission: (permissionId: string) =>
    base_url + `/scanner-permissions/${permissionId}`,
  revokePermission: (permissionId: string) =>
    base_url + `/scanner-permissions/${permissionId}/revoke`,

  grantedPermissions: base_url + `/scanner-permissions/my-granted`,
  myPermissions: base_url + "/scanner-permissions/my-permissions",
  searchUsers: base_url + "/scanner-permissions/search-users",
  canScan: (eventId: string) =>
    base_url + `/scanner-permissions/can-scan/${eventId}`,
};
