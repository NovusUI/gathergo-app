import { SOCKET_URL } from "@/constants/network";
import { startChatDelivery } from "@/services/chatDelivery";
import { useAuthStore } from "@/store/auth";
import type { MessagesInfiniteData } from "@/types/chat";
import { mergeMessagePages } from "@/utils/chatMessages";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { useAuth } from "./AuthContext";

type SocketContextType = { socket: Socket | null; isConnected: boolean };
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !refreshToken) return;
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { userId, token: refreshToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      upgrade: true,
    });
    setSocket(newSocket);
    const stopDelivery = startChatDelivery(newSocket, userId, (message) => {
      queryClient.setQueryData<MessagesInfiniteData>(
        ["messages", message.carpoolId],
        (old) => mergeMessagePages(old, [message]),
      );
    });
    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));
    newSocket.on("connect_error", (error) =>
      console.error("Socket connection failed", error.message),
    );
    newSocket.on("error", (error) =>
      showGlobalError(error.message ?? "An error occurred"),
    );
    return () => {
      stopDelivery();
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId, refreshToken, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
export const useSocket = () => useContext(SocketContext);
