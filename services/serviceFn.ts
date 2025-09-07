import { CompleteProfileData, EventsResponse, StandardResponse, authResponse, checkUsernameRes, publicProfileRes, uploadProfilePictureRes } from "@/types/auth";
import { EventDetailsResponse, GetTickets, GetTicketsResponse, PaginatedEventResponse, PaginatedSeachResponse } from "@/types/event";
import { QueryFunctionContext } from "@tanstack/react-query";
import axios from "axios";
import { getAuthToken } from "./Auth";
import { AUTH_URLS, EVENT_URL, SEARCH_URL, TRANSACTION_URL, USER_URL } from "./urls";

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    token: string; // JWT or session token
    createdAt: string;
  }
  
  export interface SignUpPayload {

    email: string;
    password: string;
    
  }



export const loginFn = async (payload: { email: string; password: string }) : Promise<authResponse>=> {
    const { data } = await axios.post<authResponse>(AUTH_URLS.login, payload);
    return data; // should return your UserResponse
  };

export const googleLoginFn = async (googleToken: string): Promise<authResponse>  => {
    const { data } = await axios.post<authResponse>( AUTH_URLS.googleLogin, {
      token: googleToken,
    });
    return data; // should match UserResponse
  };

export const signUpFn = async (payload: SignUpPayload): Promise<UserResponse> => {

        const { data } = await axios.post<UserResponse>(AUTH_URLS.signup,payload);
        return data;


};

export const updatePreference =  async (preferences: string[]) => {
    const token = await getAuthToken()
    console.log(token, preferences)
    const response = await axios.patch(
      USER_URL.preference,
      {interests: preferences , eventTypes:[]},
       { headers: 
        { Authorization: `Bearer ${token}`,'Content-Type': 'application/json' } 
       
    }
    );
    return response.data;
};

export const logoutFn = async () => {
  const res = await axios.post(AUTH_URLS.logout);
  return res.data;
};

export const getCurrentUserFn = async () => {
  const res = await axios.get(AUTH_URLS.me);
  return res.data;
};

export const getUserProfile = async ({ queryKey }): Promise<publicProfileRes> => {
  const [, userId] = queryKey;
  const token = await getAuthToken();

  const response = await axios.get<publicProfileRes>(
    USER_URL.getPublicProfle(userId),
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data;
};


  export const checkUsernameExists = async (username:string):Promise<checkUsernameRes> => {
    const token = await getAuthToken();
  
    const response = await axios.post<checkUsernameRes>(
      USER_URL.checkUsername,
      { username },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Assume API returns { exists: true/false }
    return response.data;
  };

  export const completUserProfile = async (payload:CompleteProfileData):Promise<StandardResponse> => {
    const token = await getAuthToken();
  
    const response = await axios.patch<StandardResponse>(
      USER_URL.completeProfile,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Assume API returns { exists: true/false }
    return response.data;
  };

  export const edtUserBio = async (payload:{bio:string}):Promise<StandardResponse> => {
    const token = await getAuthToken();
  
    const response = await axios.patch<StandardResponse>(
      USER_URL.editUserBio,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Assume API returns { exists: true/false }
    return response.data;
  };

  export const uploadPicture = async (formData: FormData):Promise<uploadProfilePictureRes> => {
    const token = await getAuthToken();
  
    const response = await axios.post<uploadProfilePictureRes>(
      USER_URL.profilePictureUpload,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
    return response.data;
  };


  export const createEvent = async (formData: FormData):Promise<StandardResponse> => {
    const token = await getAuthToken();
  
    const response = await axios.post<StandardResponse>(
      EVENT_URL.createEvent,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
    return response.data;
  };

  export const updateEvent = async (formData: FormData,eventId:string):Promise<StandardResponse> => {
    const token = await getAuthToken();
  
    console.log(eventId)
    const response = await axios.patch<StandardResponse>(
      EVENT_URL.updateEvent(eventId),
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
    return response.data;
  };


  export const getEventsForYou = async ({ queryKey }): Promise<EventsResponse> => {
 
    const token = await getAuthToken();
  
    const response = await axios.get<EventsResponse>(
      EVENT_URL.getForyouEvents,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
    return response.data;
  };



  export const getEventDetails = async ({ queryKey }): Promise<EventDetailsResponse> => {
    
    const [, eventId] = queryKey;
    const token = await getAuthToken();
  
    const response = await axios.get<EventDetailsResponse>(
      EVENT_URL.getEventDetails(eventId),
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
    return response.data;
  };

  export const getTransactionRef= async ({ queryKey }): Promise<StandardResponse> => {
    const [, tId] = queryKey;
    const token = await getAuthToken();
  
    const response = await axios.get<StandardResponse>(
      TRANSACTION_URL.getTransactionRef(tId),
      { 
         headers: { Authorization: `Bearer ${token}` } 
      }
    );
  
    return response.data;
  };

  export const getTicketOrRegByTransactionId= async ({ queryKey }): Promise<StandardResponse> => {
    const [, tId,type] = queryKey;
    const token = await getAuthToken();
  
    const response = await axios.get<StandardResponse>(
      TRANSACTION_URL.getTicketOrRegByTransactionId(tId),
      { params:{type},
        headers: { Authorization: `Bearer ${token}` } }
    );
  
    return response.data;
  };

  export const getTickets = async (payload:GetTickets[]):Promise<GetTicketsResponse> => {
    const token = await getAuthToken();
  
    const req = {
      items:payload
    }
    const response = await axios.post<GetTicketsResponse>(
      EVENT_URL.getTickets,
      req,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Assume API returns { exists: true/false }
    return response.data;
  };

  export const registerForEvent = async (eventid:string):Promise<GetTicketsResponse> => {
    const token = await getAuthToken();
  
   
    const response = await axios.post<GetTicketsResponse>(
      EVENT_URL.registerEvent,
      {},
      { params: { eventid }, 
      
        headers: { Authorization: `Bearer ${token}` } }
    );
    // Assume API returns { exists: true/false }
    return response.data;
  };

  export const getAllUserEvent = async (
    ctx: QueryFunctionContext<[string, string | undefined, number]>
  ): Promise<PaginatedEventResponse> => {
    const [, userId, pageSize] = ctx.queryKey;
    const page = (ctx.pageParam as number) ?? 1;
  
    const token = await getAuthToken();
    const response = await axios.get<PaginatedEventResponse>(EVENT_URL.getUserEvents, {
      params: { userId, page, pageSize },
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response.data)
    return response.data;
  };

  export const getSearchResult= async (
    ctx: QueryFunctionContext<[string, string, "events" | "communities" | "users", number]>
  ): Promise<PaginatedSeachResponse> => {
    const [, query, type, pageSize] = ctx.queryKey;
    const page = (ctx.pageParam as number) ?? 1;
  
    const token = await getAuthToken();
    const response = await axios.get<PaginatedSeachResponse>(SEARCH_URL.getSearchResult, {
      params: { query, page, type, pageSize },
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response.data)
    return response.data;
  };


 
  
