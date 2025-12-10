// hooks/useCarpoolDetails.ts
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useGetCarpoolChatAccess } from "@/services/queries";
import { QUERY_KEYS } from "@/services/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";

interface CarpoolChatDetails {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  expiresAt: string | null;
  driverId: string;
  driver: {
    id: string;
    name: string;
    avatar: string;
  };
  passengers: Array<{
    id: string;
    name: string;
    avatar: string;
    status: "ACCEPTED";
  }>;
  event?: {
    id: string;
    name: string;
  };
  canChat: boolean;
  reason?: string;
}

export const useCarpoolDetails = (
  carpoolId: string | undefined,
  options = {}
) => {
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use your existing query pattern
  const query = useGetCarpoolChatAccess(carpoolId || "", {
    enabled: !!carpoolId && !!user?.id,
    ...options,
  });

  // Extract typed data for convenience
  const carpoolData = query.data?.data as CarpoolChatDetails | undefined;

  // Listen for real-time carpool updates via WebSocket
  useEffect(() => {
    if (!socket || !carpoolId || !user?.id) return;

    const handleCarpoolUpdate = (data: {
      carpoolId: string;
      changes: Partial<CarpoolChatDetails>;
    }) => {
      if (data.carpoolId !== carpoolId) return;

      queryClient.setQueryData(
        [QUERY_KEYS.carpoolChat, carpoolId],
        (old: any) => {
          if (!old?.data) return old;

          const updatedData = { ...old.data, ...data.changes };

          // Recalculate canChat if status or expiresAt changed
          if (data.changes.status || data.changes.expiresAt) {
            const now = new Date();
            const isExpired =
              updatedData.expiresAt && new Date(updatedData.expiresAt) < now;
            const isActive = updatedData.status === "ACTIVE" && !isExpired;
            const isDriver = updatedData.driverId === user.id;
            const isPassenger = updatedData.passengers?.some(
              (p) => p.status === "ACCEPTED" && p.id === user.id
            );
            const isMember = isDriver || isPassenger;

            updatedData.canChat = isActive && isMember;

            if (!isActive) {
              updatedData.reason = `Carpool is ${updatedData.status.toLowerCase()}${
                isExpired ? " and expired" : ""
              }`;
            } else if (!isMember) {
              updatedData.reason = "You are no longer a member of this carpool";
            } else {
              updatedData.reason = undefined;
            }
          }

          return {
            ...old,
            data: updatedData,
          };
        }
      );
    };

    const handlePassengerRemoved = (data: {
      carpoolId: string;
      userId: string;
      passengerName?: string;
    }) => {
      if (data.carpoolId !== carpoolId) return;

      queryClient.setQueryData(
        [QUERY_KEYS.carpoolChat, carpoolId],
        (old: any) => {
          if (!old?.data) return old;

          const updatedPassengers = old.data.passengers.filter(
            (p: any) => p.id !== data.userId
          );

          // Recalculate canChat after passenger removal
          const isDriver = old.data.driverId === user.id;
          const isPassenger = updatedPassengers.some(
            (p: any) => p.id === user.id
          );
          const isMember = isDriver || isPassenger;

          const now = new Date();
          const isExpired =
            old.data.expiresAt && new Date(old.data.expiresAt) < now;
          const isActive = old.data.status === "ACTIVE" && !isExpired;

          return {
            ...old,
            data: {
              ...old.data,
              passengers: updatedPassengers,
              canChat: isActive && isMember,
              reason: !isMember
                ? "You are no longer a member of this carpool"
                : old.data.reason,
            },
          };
        }
      );
    };

    const handlePassengerAdded = (data: {
      carpoolId: string;
      passenger: {
        id: string;
        name: string;
        avatar: string;
        status: string;
      };
    }) => {
      if (data.carpoolId !== carpoolId) return;

      queryClient.setQueryData(
        [QUERY_KEYS.carpoolChat, carpoolId],
        (old: any) => {
          if (!old?.data) return old;

          // Check if passenger already exists
          const passengerExists = old.data.passengers.some(
            (p: any) => p.id === data.passenger.id
          );
          if (passengerExists) return old;

          return {
            ...old,
            data: {
              ...old.data,
              passengers: [
                ...old.data.passengers,
                {
                  id: data.passenger.id,
                  name: data.passenger.name,
                  avatar: data.passenger.avatar,
                  status: "ACCEPTED" as const,
                },
              ],
            },
          };
        }
      );
    };

    const handleUserRemoved = (data: {
      carpoolId: string;
      userId: string;
      message: string;
    }) => {
      // Only handle if current user is the one being removed
      if (data.carpoolId !== carpoolId || data.userId !== user.id) return;

      // Update cache
      queryClient.setQueryData(
        [QUERY_KEYS.carpoolChat, carpoolId],
        (old: any) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: {
              ...old.data,
              canChat: false,
              reason: data.message || "You have been removed from this carpool",
            },
          };
        }
      );

      // Show alert to user
      Alert.alert(
        "Removed from Carpool",
        data.message || "You have been removed from this carpool",
        [{ text: "OK", onPress: () => router.back() }]
      );
    };

    // Subscribe to events
    socket.on("carpoolUpdated", handleCarpoolUpdate);
    socket.on("passengerRemoved", handlePassengerRemoved);
    socket.on("passengerAdded", handlePassengerAdded);
    socket.on("userRemovedFromCarpool", handleUserRemoved);

    return () => {
      socket.off("carpoolUpdated", handleCarpoolUpdate);
      socket.off("passengerRemoved", handlePassengerRemoved);
      socket.off("passengerAdded", handlePassengerAdded);
      socket.off("userRemovedFromCarpool", handleUserRemoved);
    };
  }, [socket, carpoolId, user?.id, queryClient, router]);

  // Return the query with enhanced data
  return {
    ...query,
    data: carpoolData,
  };
};

// Convenience hook that matches your existing pattern
export const useCarpoolChatDetails = (
  carpoolId: string | undefined,
  options = {}
) => {
  const query = useCarpoolDetails(carpoolId, options);

  return {
    ...query,
    carpoolData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
