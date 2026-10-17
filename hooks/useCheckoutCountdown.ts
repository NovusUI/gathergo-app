import { useEffect, useState } from "react";
import { remainingCheckoutSeconds } from "@/utils/checkout";

export function useCheckoutCountdown(deadlineMs: number | null) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (deadlineMs === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadlineMs]);
  return deadlineMs === null ? null : remainingCheckoutSeconds(deadlineMs, now);
}
