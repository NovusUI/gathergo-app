import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

const MINUTE_MS = 60 * 1000;
const DEFAULT_LEAD_MINUTES = 45;
const DEFAULT_GRACE_MINUTES = 15;

interface VibeCheckPromptOptions {
  carpoolId?: string | null;
  departureTime?: string | null;
  enabled?: boolean;
  graceMinutes?: number;
  leadMinutes?: number;
  userId?: string | null;
}

interface VibeCheckTiming {
  departureDate: Date;
  isInWindow: boolean;
  minutesUntil: number;
}

const resolveTimeOnlyDeparture = (value: string, now: Date) => {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);

  if (hours > 23 || minutes > 59 || seconds > 59) return null;

  return [-1, 0, 1].map((dayOffset) => {
    const date = new Date(now);
    date.setDate(now.getDate() + dayOffset);
    date.setHours(hours, minutes, seconds, 0);
    return date;
  });
};

const resolveDepartureDate = (
  departureTime: string | null | undefined,
  now: Date,
  leadMinutes: number,
  graceMinutes: number
) => {
  const trimmed = departureTime?.trim();
  if (!trimmed) return null;

  const timeOnlyCandidates = resolveTimeOnlyDeparture(trimmed, now);
  if (timeOnlyCandidates) {
    const inWindowCandidate = timeOnlyCandidates.find((candidate) => {
      const minutesUntil = (candidate.getTime() - now.getTime()) / MINUTE_MS;
      return minutesUntil <= leadMinutes && minutesUntil >= -graceMinutes;
    });

    if (inWindowCandidate) return inWindowCandidate;

    return timeOnlyCandidates.reduce((closest, candidate) => {
      const closestDistance = Math.abs(closest.getTime() - now.getTime());
      const candidateDistance = Math.abs(candidate.getTime() - now.getTime());
      return candidateDistance < closestDistance ? candidate : closest;
    });
  }

  const parsedDate = new Date(trimmed);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const getVibeCheckTiming = (
  departureTime: string | null | undefined,
  now = new Date(),
  leadMinutes = DEFAULT_LEAD_MINUTES,
  graceMinutes = DEFAULT_GRACE_MINUTES
): VibeCheckTiming | null => {
  const departureDate = resolveDepartureDate(
    departureTime,
    now,
    leadMinutes,
    graceMinutes
  );

  if (!departureDate) return null;

  const minutesUntil = Math.round(
    (departureDate.getTime() - now.getTime()) / MINUTE_MS
  );

  return {
    departureDate,
    isInWindow:
      minutesUntil <= leadMinutes && minutesUntil >= -graceMinutes,
    minutesUntil,
  };
};

export const useVibeCheckPrompt = ({
  carpoolId,
  departureTime,
  enabled = true,
  graceMinutes = DEFAULT_GRACE_MINUTES,
  leadMinutes = DEFAULT_LEAD_MINUTES,
  userId,
}: VibeCheckPromptOptions) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [hasDismissedAutoPrompt, setHasDismissedAutoPrompt] = useState<
    boolean | null
  >(null);
  const [manualVisible, setManualVisible] = useState(false);

  const storageKey = useMemo(() => {
    if (!carpoolId || !departureTime) return null;
    return `vibe_check_prompt:${carpoolId}:${userId ?? "guest"}:${departureTime}`;
  }, [carpoolId, departureTime, userId]);

  const timing = useMemo(
    () =>
      getVibeCheckTiming(departureTime, new Date(nowMs), leadMinutes, graceMinutes),
    [departureTime, graceMinutes, leadMinutes, nowMs]
  );

  const autoVisible =
    enabled &&
    hasDismissedAutoPrompt === false &&
    Boolean(timing?.isInWindow);

  useEffect(() => {
    if (!enabled || !departureTime) return;

    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), MINUTE_MS);

    return () => clearInterval(interval);
  }, [departureTime, enabled]);

  useEffect(() => {
    if (!storageKey) {
      setHasDismissedAutoPrompt(true);
      return;
    }

    let active = true;
    setHasDismissedAutoPrompt(null);

    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (active) setHasDismissedAutoPrompt(value === "dismissed");
      })
      .catch((error) => {
        console.log("failed to load vibe-check state", error);
        if (active) setHasDismissedAutoPrompt(false);
      });

    return () => {
      active = false;
    };
  }, [storageKey]);

  const open = useCallback(() => {
    setManualVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setManualVisible(false);

    if (!autoVisible) return;

    setHasDismissedAutoPrompt(true);
    if (storageKey) {
      AsyncStorage.setItem(storageKey, "dismissed").catch((error) =>
        console.log("failed to save vibe-check state", error)
      );
    }
  }, [autoVisible, storageKey]);

  return {
    dismiss,
    isNearDeparture: Boolean(timing?.isInWindow),
    open,
    timing,
    visible: manualVisible || autoVisible,
  };
};
