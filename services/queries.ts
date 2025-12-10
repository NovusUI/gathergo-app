import { EventsResponse, StandardResponse } from "@/types/auth";
import { EventDetailsResponse, PaginatedEventResponse } from "@/types/event";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryKeys";
import {
  getAllUserEvent,
  getCarpoolChatAccess,
  getCarpoolDetails,
  getCarpoolsForYou,
  getCurrentUserFn,
  getEventDetails,
  getEventsForYou,
  getSearchResult,
  getTicketOrRegByTransactionId,
  getTransactionRef,
  getUserProfile,
} from "./serviceFn";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: getCurrentUserFn,
    staleTime: 1000 * 60 * 5, // cache for 5 mins
  });
};

export const useUserProfile = (userId?: string, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.userPublicProfile, userId], // stable primitive
    queryFn: getUserProfile,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    ...options,
  });
};

export const useForYouEvents = (userId?: string, options = {}) => {
  return useQuery<EventsResponse>({
    queryKey: [QUERY_KEYS.foryouEvents, userId], // stable primitive
    queryFn: getEventsForYou,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

// export const useGetUsersEvents = (page:number, pageSize:number, userId?: string, options = {}) => {
//   return useQuery<EventsResponse>({
//     queryKey: [QUERY_KEYS.getUserEvents, userId,page,pageSize],  // stable primitive
//     queryFn: getAllUserEvent,
//     staleTime: 1000 ,
//     retry: 1,
//     ...options,
//   });
// };

export const useGetUsersEvents = (
  userId?: string,
  pageSize = 5,
  options?: any
) => {
  return useInfiniteQuery<PaginatedEventResponse>({
    queryKey: [QUERY_KEYS.getUserEvents, userId, pageSize],
    queryFn: getAllUserEvent,
    initialPageParam: 1, // Required
    getNextPageParam: (lastPage) => {
      const { total, pageSize, page } = lastPage.meta;
      const maxPages = Math.ceil(total / pageSize);
      return page < maxPages ? page + 1 : undefined;
    },
    ...options,
  });
};

export const useGetSearchResult = (
  query: string,
  type: "events" | "communities" | "users",
  pageSize = 5,
  options?: any
) => {
  return useInfiniteQuery<PaginatedEventResponse>({
    queryKey: [QUERY_KEYS.getUserEvents, query, type, pageSize],
    queryFn: getSearchResult,
    initialPageParam: 1, // Required
    getNextPageParam: (lastPage) => {
      const { total, pageSize, page } = lastPage.meta;
      const maxPages = Math.ceil(total / pageSize);
      return page < maxPages ? page + 1 : undefined;
    },
    ...options,
  });
};

export const useEventDetails = (eventId: string, options = {}) => {
  return useQuery<EventDetailsResponse>({
    queryKey: [QUERY_KEYS.eventDetails, eventId], // stable primitive
    queryFn: getEventDetails,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

export const useGetCarpoolDetails = (id: string, options = {}) => {
  return useQuery<StandardResponse>({
    queryKey: [QUERY_KEYS.carpoolDetails, id], // stable primitive
    queryFn: getCarpoolDetails,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

export const useForYouCarpools = (options = {}) => {
  return useQuery<StandardResponse>({
    queryKey: [QUERY_KEYS.carpoolForYou], // stable primitive
    queryFn: getCarpoolsForYou,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

export const useTransactionRef = (tId: string, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.transactionRef, tId], // stable primitive
    queryFn: getTransactionRef,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    ...options,
  });
};

export const useTicketOrRegByTransactionRef = (
  tId: string,
  type: "REGISTRATION" | "TICKET",
  options = {}
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ticketOrReg, tId, type], // stable primitive
    queryFn: getTicketOrRegByTransactionId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    ...options,
  });
};

export const useGetCarpoolChatAccess = (id: string, options = {}) => {
  return useQuery<StandardResponse>({
    queryKey: [QUERY_KEYS.carpoolChat, id], // stable primitive
    queryFn: getCarpoolChatAccess,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};
