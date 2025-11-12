const base_url = "http://192.168.15.150:4000/api/v1";

export const AUTH_URLS = {
  login: base_url + "/auth/login",
  signup: base_url + "/auth/signup",
  googleLogin: base_url + "/auth/google",
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
};

export const TRANSACTION_URL = {
  getTransactionRef: (id: string) =>
    base_url + `/transaction-reference/status/${id}`,
  getTicketOrRegByTransactionId: (id: string) =>
    base_url + `/transaction-reference/ticketorreg/${id}`,
};

export const SEARCH_URL = {
  getSearchResult: base_url + "/search",
};

export const CARPOOL_URL = {
  createCarpool: base_url + "/carpool",
  getCarpoolDetails: (id: string) => base_url + `/carpool/${id}`,
  getForYouCarpool: base_url + "/carpool/for-you",
  updateCarpool: (carpoolId: string) => base_url + `/carpool/${carpoolId}`,
  requestCarpool: (carpoolId: string) =>
    base_url + `/carpool/${carpoolId}/request/`,
  respondToRequest: (requestId: string) =>
    base_url + `/carpool/passenger/${requestId}/respond`,
  removePassenger: (requestId: string) =>
    base_url + `/carpool/passenger/remove/${requestId}`,
  leaveCarpool: (carpoolId: string) => base_url + `/carpool/leave/${carpoolId}`,
};
