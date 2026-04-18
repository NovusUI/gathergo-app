import { useCallback, useEffect, useMemo, useState } from "react";

const RESEND_WAIT_SECONDS_PATTERN = /please wait\s+(\d+)s/i;

export const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

const resolveRemainingSeconds = (
  cooldownSeconds: number,
  startedAtMs?: number
) => {
  if (!startedAtMs || !Number.isFinite(startedAtMs)) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
  return Math.max(cooldownSeconds - elapsedSeconds, 0);
};

export const formatResendCooldown = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const extractCooldownSecondsFromMessage = (message?: string | null) => {
  if (!message) {
    return 0;
  }

  const match = message.match(RESEND_WAIT_SECONDS_PATTERN);
  if (!match) {
    return 0;
  }

  return Number(match[1]) || 0;
};

export const useResendCooldown = ({
  cooldownSeconds = DEFAULT_RESEND_COOLDOWN_SECONDS,
  startedAtMs,
}: {
  cooldownSeconds?: number;
  startedAtMs?: number;
} = {}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    resolveRemainingSeconds(cooldownSeconds, startedAtMs)
  );

  useEffect(() => {
    setRemainingSeconds(resolveRemainingSeconds(cooldownSeconds, startedAtMs));
  }, [cooldownSeconds, startedAtMs]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const restart = useCallback(
    (nextCooldownSeconds = cooldownSeconds) => {
      setRemainingSeconds(Math.max(0, Math.floor(nextCooldownSeconds)));
    },
    [cooldownSeconds]
  );

  const syncFromMessage = useCallback((message?: string | null) => {
    const nextCooldownSeconds = extractCooldownSecondsFromMessage(message);

    if (nextCooldownSeconds > 0) {
      setRemainingSeconds(nextCooldownSeconds);
    }

    return nextCooldownSeconds;
  }, []);

  const formattedRemaining = useMemo(
    () => formatResendCooldown(remainingSeconds),
    [remainingSeconds]
  );

  return {
    remainingSeconds,
    formattedRemaining,
    isCoolingDown: remainingSeconds > 0,
    restart,
    syncFromMessage,
  };
};
