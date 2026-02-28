import {
  useGetDashboard,
  useGetDashboardEvents,
  useGetEventDashboard,
  useGetPayments,
  useGetShortcut,
  useGetShortcutEvent,
} from "@/services/queries";

export const useDashboardData = () => {
  const query = useGetDashboard();

  return {
    ...query,
    dashboardData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    //refetch: query.refetch,
  };
};

export const useEventDashboardData = (eventId: string, options = {}) => {
  const query = useGetEventDashboard(eventId, options);

  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
    //refetch: query.refetch,
  };
};

export const useDashboardEvents = (
  filter?: string,
  pageSize?: number,
  options = {}
) => {
  const query = useGetDashboardEvents(filter, pageSize, options);

  return {
    ...query,
    dashboardEventsData: query.data,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    error: query.error,
    enabled: query.isEnabled,
    //refetch: query.refetch,
  };
};

export const usePayments = (
  eventId?: string,
  pageSize?: number,
  option = {}
) => {
  const query = useGetPayments(eventId, pageSize, option);

  return {
    ...query,
    paymenetsData: query.data,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    error: query.error,
    enabled: query.isEnabled,
    //refetch: query.refetch,
  };
};

export const useShortcut = () => {
  const query = useGetShortcut();

  return {
    ...query,
    shortcuts: query.data,
    isLoading: query.isPending,
    error: query.error,
    //refetch: query.refetch,
  };
};

export const useShortcutEvent = (eventId: string, option = {}) => {
  const query = useGetShortcutEvent(eventId, option);

  return {
    ...query,
    shortcuts: query.data,
    isLoading: query.isPending,
    error: query.error,
    //refetch: query.refetch,
  };
};
