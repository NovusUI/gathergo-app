import { useQuery } from "@tanstack/react-query";

export const useConversations = () =>
  useQuery({
    queryKey: ["conversations"],
    queryFn: () => [],
    enabled: false, // socket-only data
  });

export const useUnreadCounts = () =>
  useQuery({
    queryKey: ["unreadCounts"],
    queryFn: () => ({ totalUnread: 0, unreadBycarpool: {} }),
    enabled: false,
  });
