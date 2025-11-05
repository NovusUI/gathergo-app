import client from "@/api/client";
import {
  CompleteProfileData,
  EventsResponse,
  StandardResponse,
  authResponse,
  checkUsernameRes,
  publicProfileRes,
  uploadProfilePictureRes,
} from "@/types/auth";
import { CarpoolForm } from "@/types/carpool";
import {
  EventDetailsResponse,
  GetTickets,
  GetTicketsResponse,
  PaginatedEventResponse,
  PaginatedSeachResponse,
} from "@/types/event";
import { QueryFunctionContext } from "@tanstack/react-query";

import {
  AUTH_URLS,
  CARPOOL_URL,
  EVENT_URL,
  SEARCH_URL,
  TRANSACTION_URL,
  USER_URL,
} from "./urls";

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

export const signUpFn = async (
  payload: SignUpPayload
): Promise<UserResponse> => {
  const { data } = await client.post<UserResponse>(AUTH_URLS.signup, payload);
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

export const getUserProfile = async ({
  queryKey,
}): Promise<publicProfileRes> => {
  const [, userId] = queryKey;

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

export const uploadPicture = async (
  formData: FormData
): Promise<uploadProfilePictureRes> => {
  const response = await client.post<uploadProfilePictureRes>(
    USER_URL.profilePictureUpload,
    formData
  );

  return response.data;
};

export const createEvent = async (
  formData: FormData
): Promise<StandardResponse> => {
  const response = await client.post<StandardResponse>(
    EVENT_URL.createEvent,
    formData
  );

  return response.data;
};

export const updateEvent = async (
  formData: FormData,
  eventId: string
): Promise<StandardResponse> => {
  const response = await client.patch<StandardResponse>(
    EVENT_URL.updateEvent(eventId),
    formData
  );

  return response.data;
};

export const getEventsForYou = async ({
  queryKey,
}): Promise<EventsResponse> => {
  const response = await client.get<EventsResponse>(EVENT_URL.getForyouEvents);
  return response.data;
};

export const getEventDetails = async ({
  queryKey,
}): Promise<EventDetailsResponse> => {
  const [, eventId] = queryKey;

  const response = await client.get<EventDetailsResponse>(
    EVENT_URL.getEventDetails(eventId)
  );

  return response.data;
};

export const getTransactionRef = async ({
  queryKey,
}): Promise<StandardResponse> => {
  const [, tId] = queryKey;

  const response = await client.get<StandardResponse>(
    TRANSACTION_URL.getTransactionRef(tId)
  );

  return response.data;
};

export const getTicketOrRegByTransactionId = async ({
  queryKey,
}): Promise<StandardResponse> => {
  const [, tId, type] = queryKey;

  const response = await client.get<StandardResponse>(
    TRANSACTION_URL.getTicketOrRegByTransactionId(tId),
    { params: { type } }
  );

  return response.data;
};

export const getTickets = async (
  payload: GetTickets[]
): Promise<GetTicketsResponse> => {
  const req = {
    items: payload,
  };
  const response = await client.post<GetTicketsResponse>(
    EVENT_URL.getTickets,
    req
  );
  // Assume API returns { exists: true/false }
  return response.data;
};

export const registerForEvent = async (
  eventid: string
): Promise<GetTicketsResponse> => {
  const response = await client.post<GetTicketsResponse>(
    EVENT_URL.registerEvent,
    {},
    {
      params: { eventid },
    }
  );
  // Assume API returns { exists: true/false }
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

export const getCarpoolDetails = async ({
  queryKey,
}): Promise<StandardResponse> => {
  const [, id] = queryKey;

  const response = await client.get<StandardResponse>(
    CARPOOL_URL.getCarpoolDetails(id)
  );

  return response.data;
};

export const getCarpoolsForYou = async ({
  queryKey,
}): Promise<StandardResponse> => {
  const response = await client.get<StandardResponse>(
    CARPOOL_URL.getForYouCarpool
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
