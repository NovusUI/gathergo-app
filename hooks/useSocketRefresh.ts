import { useSocket } from "@/context/SocketContext";
import { useCallback, useEffect, useState } from "react";

export function useSocketRefresh(
  responseEvent: "notificationTray" | "conversationTrayUpdate",
  request: () => void,
) {
  const { socket } = useSocket();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const finishRefresh = () => setRefreshing(false);
    socket.on(responseEvent, finishRefresh);
    socket.on("disconnect", finishRefresh);
    socket.on("error", finishRefresh);
    return () => {
      socket.off(responseEvent, finishRefresh);
      socket.off("disconnect", finishRefresh);
      socket.off("error", finishRefresh);
    };
  }, [responseEvent, socket]);

  const refresh = useCallback(() => {
    if (!socket?.connected) return;
    setRefreshing(true);
    request();
  }, [request, socket]);

  return { refreshing, refresh };
}
