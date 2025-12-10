// contexts/SocketContext.tsx
import { useAuthStore } from "@/store/auth";
import { useMessageQueueStore } from "@/store/messageQueue";
import { showGlobalError } from "@/utils/globalErrorHandler";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Socket, io } from "socket.io-client";
import { useAuth } from "./AuthContext";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { queue, clearQueue } = useMessageQueueStore();
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const userId = user?.id;
  const { refreshToken } = useAuthStore();
  const isConnected = useMemo(() => socket?.connected || false, [socket]);

  useEffect(() => {
    if (userId && refreshToken) {
      if (socketRef.current) return;

      const newSocket = io("http://10.170.32.53:4000", {
        transports: ["websocket"],
        auth: { userId: user?.id, token: refreshToken },
        // Enhanced reconnection settings
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Force new connection to ensure clean state
        forceNew: true,
        // Upgrade ASAP from HTTP long-polling to WebSocket
        upgrade: true,
      });
      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on("connect", async () => {
        console.log("✅ Connected to socket server");

        console.log(queue.length, "rthjj");
        if (queue.length > 0) {
          for (const { carpoolId, content, tempId } of queue) {
            newSocket.emit("sendMessage", { carpoolId, content, tempId });
          }
          await clearQueue();
        }
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connect error:", err.message);
      });
      newSocket.on("error", (err) => {
        console.error("error ", err);
        showGlobalError(err.message ?? "an error occurred");
      });

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
      };
    }
  }, [userId, refreshToken]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
