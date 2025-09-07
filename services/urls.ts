
const base_url = "http://192.168.219.150:4000/api/v1"

export const AUTH_URLS = {
    login: base_url +"/auth/login",
    signup: base_url + "/auth/signup",
    googleLogin: base_url + "/auth/google",
    logout: "/auth/logout",
    me: "/auth/me", // get current user
  };

export const USER_URL = {

  preference: base_url + "/preferences",
  getPublicProfle:(userId:string)=> base_url + `/user/public/${userId}`,
  checkUsername: base_url + "/auth/verify-username",
  completeProfile : base_url + "/user/complete-profile",
  editUserBio: base_url + "/user/edit-bio",
  profilePictureUpload: base_url + "/user/profile-picture",
}


export const EVENT_URL = {

   createEvent: base_url + "/events",
   updateEvent: (eventId:string)=> base_url + `/events/${eventId}`,
   getForyouEvents: base_url + "/events/for-you",
   getEventDetails:(eventId:string)=> base_url + `/events/${eventId}`,
   getTickets: base_url + "/transaction-reference/initiate",
   registerEvent: base_url + `/transaction-reference/initiateReg`,
   getUserEvents: base_url + '/events'

}

export const TRANSACTION_URL = {
  getTransactionRef: (id:string)=> base_url + `/transaction-reference/status/${id}`,
  getTicketOrRegByTransactionId: (id:string)=> base_url + `/transaction-reference/ticketorreg/${id}`
}

export const SEARCH_URL = {
  getSearchResult: base_url + "/search"
}

