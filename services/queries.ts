import { EventsResponse, StandardResponse } from "@/types/auth";
import { PaginatedEventCarpoolsResponse } from "@/types/carpool";
import {
  EventDetailsResponse,
  PaginatedDashboardEventsResponse,
  PaginatedEventResponse,
} from "@/types/event";
import {
  ScanHistoryResponse,
  ScannerPermissionResponse,
  ScannerStatsResponse,
  SearchUsersResponse,
} from "@/types/scanner";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryKeys";
import {
  canScanFn,
  getAllUserEvent,
  getCarpoolChatAccess,
  getCarpoolDetails,
  getCarpoolsForYou,
  getPaginatedEventCarpools,
  getCurrentUserFn,
  getDashboardData,
  getDashboardEvents,
  getEventDashboardData,
  getEventDetails,
  getEventImageStatus,
  getEventsForYou,
  getGrantedScannerPermissionsFn,
  getMyScannerPermissionsFn,
  getPayments,
  getScanHistoryFn,
  getScannerStatsFn,
  getSearchResult,
  getShortcut,
  getShortcutEvent,
  getTicketOrRegByTransactionId,
  getTransactionRef,
  getUserProfile,
  searchScannerUsersFn,
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

export const usePaginatedEventCarpools = (
  params: {
    eventId: string;
    filter?: "all" | "close_to_you" | "followed";
    latitude?: number;
    longitude?: number;
  },
  pageSize = 20,
  options?: any
) => {
  return useInfiniteQuery<PaginatedEventCarpoolsResponse>({
    queryKey: [
      QUERY_KEYS.eventCarpoolsPaginated,
      { ...params, pageSize },
    ],
    queryFn: getPaginatedEventCarpools,
    initialPageParam: 1,
    enabled: !!params.eventId,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta?.hasNextPage) return undefined;
      return lastPage.meta.page + 1;
    },
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

export const useEventImageStatus = (eventId: string, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.eventImageStatus, eventId],
    queryFn: getEventImageStatus,
    enabled: !!eventId,
    refetchInterval: (query) => {
      // Only poll if image is still processing
      const data = query.state.data?.data;
      return data?.isProcessing ? 3000 : false;
    },
    ...options,
  });
};

export const useGetDashboard = (options = {}) => {
  return useQuery<StandardResponse>({
    queryKey: [QUERY_KEYS.getDashboard],
    queryFn: getDashboardData,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

export const useGetEventDashboard = (eventId: string, options = {}) => {
  return useQuery<StandardResponse>({
    queryKey: [QUERY_KEYS.getEventDashboard, eventId],
    queryFn: getEventDashboardData,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

export const useGetDashboardEvents = (
  filter?: string,
  pageSize = 10,
  options?: any
) => {
  return useInfiniteQuery<PaginatedDashboardEventsResponse>({
    queryKey: [QUERY_KEYS.getDashboardEvents, filter, pageSize],
    queryFn: getDashboardEvents,
    initialPageParam: 1, // Required
    getNextPageParam: (lastPage) => {
      const { total, pageSize, page } = lastPage.meta;
      const maxPages = Math.ceil(total / pageSize);
      return page < maxPages ? page + 1 : undefined;
    },
    ...options,
  });
};

export const useGetPayments = (
  eventId?: string,
  pageSize = 10,
  options?: any
) => {
  return useInfiniteQuery<PaginatedEventResponse>({
    queryKey: [QUERY_KEYS.getPayments, eventId, pageSize],
    queryFn: getPayments,
    initialPageParam: 1, // Required
    getNextPageParam: (lastPage) => {
      const { total, pageSize, page } = lastPage.meta;
      const maxPages = Math.ceil(total / pageSize);
      return page < maxPages ? page + 1 : undefined;
    },
    ...options,
  });
};

export const useGetShortcut = (options = {}) => {
  return useQuery<StandardResponse>({
    queryKey: [QUERY_KEYS.getShortcut],
    queryFn: getShortcut,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

export const useGetShortcutEvent = (eventId: string, options = {}) => {
  return useQuery<StandardResponse>({
    queryKey: [QUERY_KEYS.getShortcut, eventId],
    queryFn: getShortcutEvent,
    staleTime: 1000 * 60,
    retry: 1,
    ...options,
  });
};

// Scanner queries
export const useScannerStats = (options = {}) => {
  return useQuery<ScannerStatsResponse>({
    queryKey: [QUERY_KEYS.scannerStats],
    queryFn: getScannerStatsFn,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
    ...options,
  });
};

export const useScanHistory = (
  filters?: {
    eventId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
  pageSize = 20,
  options?: any
) => {
  return useInfiniteQuery<ScanHistoryResponse>({
    queryKey: [QUERY_KEYS.scanHistory, filters, pageSize],
    queryFn: getScanHistoryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { total, pageSize, page } = lastPage.meta;
      const maxPages = Math.ceil(total / pageSize);
      return page < maxPages ? page + 1 : undefined;
    },
    ...options,
  });
};

export const useMyScannerPermissions = (options = {}) => {
  return useQuery<ScannerPermissionResponse>({
    queryKey: [QUERY_KEYS.myScannerPermissions],
    queryFn: getMyScannerPermissionsFn,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
    ...options,
  });
};

export const useGrantedScannerPermissions = (options = {}) => {
  return useQuery<ScannerPermissionResponse>({
    queryKey: [QUERY_KEYS.grantedScannerPermissions],
    queryFn: getGrantedScannerPermissionsFn,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
    ...options,
  });
};

export const useSearchScannerUsers = (
  query: {
    email?: string;
    username?: string;
    fullName?: string;
  },
  pageSize = 10,
  options?: any
) => {
  return useInfiniteQuery<SearchUsersResponse>({
    queryKey: [QUERY_KEYS.scannerUsersSearch, query, pageSize],
    queryFn: searchScannerUsersFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { total, pageSize, page } = lastPage.meta;
      const maxPages = Math.ceil(total / pageSize);
      return page < maxPages ? page + 1 : undefined;
    },
    ...options,
  });
};

export const useCanScan = (eventId: string, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.canScan, eventId],
    queryFn: () => canScanFn(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
    ...options,
  });
};
