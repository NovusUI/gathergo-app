import type { CarpoolVibeSafetySignal } from "@/constants/carpool";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VibeCheckRole = "pooler" | "rider" | "member";

export interface VibeCheckPassenger {
  id: string;
  avatar?: string | null;
  name?: string | null;
  status?: string | null;
  username?: string | null;
}

export interface VibeCheckPassengerHandshakeState {
  completedAt?: string | null;
  passengerId: string;
  poolerConfirmedAt?: string | null;
  poolerUserId?: string | null;
  riderConfirmedAt?: string | null;
  riderUserId?: string | null;
  updatedAt?: string | null;
}

export interface VibeCheckPassengerHandshake
  extends VibeCheckPassengerHandshakeState {
  currentUserConfirmed: boolean;
  isComplete: boolean;
  label: string;
  passengerAvatar?: string | null;
  poolerConfirmed: boolean;
  riderConfirmed: boolean;
  waitingForLabel: string;
}

export interface VibeCheckHandshakeState {
  carpoolId: string;
  departureTime?: string | null;
  handshakes: Record<string, VibeCheckPassengerHandshakeState>;
  updatedAt?: string | null;
}

interface VibeCheckMessage {
  content?: string | null;
  createdAt?: string | null;
  senderId?: string | null;
}

interface VibeCheckSocket {
  connected?: boolean;
  emit: (event: string, payload?: unknown) => void;
  off: (event: string, listener: (...args: any[]) => void) => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
}

interface UseVibeCheckHandshakeOptions {
  activePassengerId?: string | null;
  carpoolId?: string | null;
  departureTime?: string | null;
  driverId?: string | null;
  enabled?: boolean;
  messages?: VibeCheckMessage[];
  passengers?: VibeCheckPassenger[];
  role: VibeCheckRole;
  socket?: VibeCheckSocket | null;
  userId?: string | null;
}

interface VibeCheckConfirmOptions {
  passengerId?: string | null;
  passengerLabel?: string | null;
  signalAction: string;
  signalTitle: string;
}

interface VibeCheckHandshakePatch {
  completedAt?: string | null;
  passengerId?: string | null;
  poolerConfirmedAt?: string | null;
  poolerUserId?: string | null;
  riderConfirmedAt?: string | null;
  riderUserId?: string | null;
  updatedAt?: string | null;
}

export interface VibeCheckConfirmResult {
  passengerId: string;
  passengerLabel?: string | null;
  role: VibeCheckRole;
}

const VIBE_CHECK_CHAT_PREFIX = "Vibe signal - ";
const VIBE_CHECK_SOCKET_EVENT = "vibeCheckConfirm";
const VIBE_CHECK_SOCKET_UPDATE_EVENT = "vibeCheckUpdated";
const VIBE_CHECK_PASSENGER_PATTERN = /\s*\[passenger:([^\]]+)\]\s*\.?$/;

const normalizeRole = (role?: string | null): VibeCheckRole => {
  if (role === "driver" || role === "pooler") return "pooler";
  if (role === "passenger" || role === "rider") return "rider";
  return "member";
};

const getInitialHandshakeState = (
  carpoolId?: string | null,
  departureTime?: string | null
): VibeCheckHandshakeState => ({
  carpoolId: carpoolId ?? "",
  departureTime: departureTime ?? null,
  handshakes: {},
  updatedAt: null,
});

const getPassengerLabel = (
  passenger: VibeCheckPassenger,
  index: number,
  currentUserId?: string | null
) => {
  if (currentUserId && passenger.id === currentUserId) return "You";

  return (
    passenger.username ||
    passenger.name ||
    `Rider ${index + 1}`
  );
};

const getPassengerCompletedAt = (
  handshake: VibeCheckPassengerHandshakeState
) => {
  if (!handshake.poolerConfirmedAt || !handshake.riderConfirmedAt) return null;

  return (
    handshake.completedAt ||
    new Date(
      Math.max(
        new Date(handshake.poolerConfirmedAt).getTime(),
        new Date(handshake.riderConfirmedAt).getTime()
      )
    ).toISOString()
  );
};

const getEmptyPassengerHandshake = (
  passengerId: string
): VibeCheckPassengerHandshakeState => ({
  completedAt: null,
  passengerId,
  poolerConfirmedAt: null,
  poolerUserId: null,
  riderConfirmedAt: null,
  riderUserId: null,
  updatedAt: null,
});

const mergePassengerHandshake = (
  current: VibeCheckPassengerHandshakeState | undefined,
  incoming: VibeCheckHandshakePatch
): VibeCheckPassengerHandshakeState => {
  const passengerId = incoming.passengerId;
  const base = current ?? getEmptyPassengerHandshake(passengerId ?? "");
  const next: VibeCheckPassengerHandshakeState = {
    ...base,
    passengerId: passengerId ?? base.passengerId,
    poolerConfirmedAt:
      base.poolerConfirmedAt ?? incoming.poolerConfirmedAt ?? null,
    poolerUserId: base.poolerUserId ?? incoming.poolerUserId ?? null,
    riderConfirmedAt:
      base.riderConfirmedAt ?? incoming.riderConfirmedAt ?? null,
    riderUserId: base.riderUserId ?? incoming.riderUserId ?? null,
    updatedAt: incoming.updatedAt ?? new Date().toISOString(),
  };

  next.completedAt = getPassengerCompletedAt(next);

  return next;
};

const hasSameHandshakeProgress = (
  current: VibeCheckHandshakeState,
  next: VibeCheckHandshakeState
) => {
  if (
    current.carpoolId !== next.carpoolId ||
    current.departureTime !== next.departureTime
  ) {
    return false;
  }

  const currentIds = Object.keys(current.handshakes);
  const nextIds = Object.keys(next.handshakes);
  if (currentIds.length !== nextIds.length) return false;

  return nextIds.every((passengerId) => {
    const currentHandshake = current.handshakes[passengerId];
    const nextHandshake = next.handshakes[passengerId];

    return (
      currentHandshake?.completedAt === nextHandshake?.completedAt &&
      currentHandshake?.poolerConfirmedAt ===
        nextHandshake?.poolerConfirmedAt &&
      currentHandshake?.poolerUserId === nextHandshake?.poolerUserId &&
      currentHandshake?.riderConfirmedAt === nextHandshake?.riderConfirmedAt &&
      currentHandshake?.riderUserId === nextHandshake?.riderUserId
    );
  });
};

const getMessageParts = (content?: string | null) => {
  const text = content?.trim();
  if (!text?.startsWith(VIBE_CHECK_CHAT_PREFIX)) return null;

  const withoutPrefix = text.slice(VIBE_CHECK_CHAT_PREFIX.length);
  const separatorIndex = withoutPrefix.indexOf(": ");
  if (separatorIndex < 0) return null;

  const signalTitle = withoutPrefix.slice(0, separatorIndex).trim();
  const rest = withoutPrefix.slice(separatorIndex + 2);
  const actorMatch = rest.match(/^(Rider|Pooler) says (.*)$/);
  if (!actorMatch) return null;

  const passengerMatch = actorMatch[2].match(VIBE_CHECK_PASSENGER_PATTERN);
  const signalAction = actorMatch[2]
    .replace(VIBE_CHECK_PASSENGER_PATTERN, "")
    .replace(/\.$/, "")
    .trim();

  if (!signalTitle || !signalAction) return null;

  return {
    actorLabel: actorMatch[1] as "Rider" | "Pooler",
    passengerId: passengerMatch?.[1] ?? null,
    signalAction,
    signalTitle,
  };
};

export const getVibeCheckMessageDetails = (content?: string | null) =>
  getMessageParts(content);

export const isVibeCheckChatMessage = (content?: string | null) =>
  Boolean(getVibeCheckMessageDetails(content));

const parseVibeCheckMessage = (
  message: VibeCheckMessage,
  driverId?: string | null,
  fallbackPassengerId?: string | null
): VibeCheckHandshakePatch | null => {
  const details = getVibeCheckMessageDetails(message.content);
  if (!details) return null;

  const senderIsPooler = Boolean(driverId) && message.senderId === driverId;
  if (details.actorLabel === "Pooler" && !senderIsPooler) return null;
  if (details.actorLabel === "Rider" && senderIsPooler) return null;

  const role = details.actorLabel === "Pooler" ? "pooler" : "rider";
  const confirmedAt = message.createdAt || new Date().toISOString();
  const passengerId =
    details.passengerId ||
    (role === "rider" ? message.senderId : fallbackPassengerId);

  if (!passengerId) return null;

  return role === "pooler"
    ? {
        passengerId,
        poolerConfirmedAt: confirmedAt,
        poolerUserId: message.senderId ?? null,
      }
    : {
        passengerId,
        riderConfirmedAt: confirmedAt,
        riderUserId: message.senderId ?? null,
    };
};

const getHandshakePatchSignature = (patch: VibeCheckHandshakePatch) =>
  [
    patch.passengerId ?? "",
    patch.poolerConfirmedAt ?? "",
    patch.poolerUserId ?? "",
    patch.riderConfirmedAt ?? "",
    patch.riderUserId ?? "",
  ].join(":");

const getPatchFromSocketPayload = (
  payload: any,
  fallbackPassengerId?: string | null
): VibeCheckHandshakePatch | null => {
  const role = normalizeRole(payload?.role);
  if (role === "member") return null;

  const passengerId =
    payload?.passengerId ||
    (role === "rider" ? payload?.userId : fallbackPassengerId);
  if (!passengerId) return null;

  const confirmedAt = payload?.confirmedAt || new Date().toISOString();

  return role === "pooler"
    ? {
        passengerId,
        poolerConfirmedAt: confirmedAt,
        poolerUserId: payload?.userId ?? null,
      }
    : {
        passengerId,
        riderConfirmedAt: confirmedAt,
        riderUserId: payload?.userId ?? null,
      };
};

export const createVibeCheckChatMessage = (
  role: VibeCheckRole,
  safetySignal: CarpoolVibeSafetySignal,
  options?: {
    passengerId?: string | null;
    passengerLabel?: string | null;
  }
) => {
  const passengerMarker = options?.passengerId
    ? ` [passenger:${options.passengerId}]`
    : "";
  const poolerAction = options?.passengerLabel
    ? `${safetySignal.driverAction} for ${options.passengerLabel}`
    : safetySignal.driverAction;

  if (role === "pooler") {
    return `${VIBE_CHECK_CHAT_PREFIX}${safetySignal.title}: Pooler says ${poolerAction}.${passengerMarker}`;
  }

  return `${VIBE_CHECK_CHAT_PREFIX}${safetySignal.title}: Rider says ${safetySignal.passengerAction}.${passengerMarker}`;
};

export const useVibeCheckHandshake = ({
  activePassengerId,
  carpoolId,
  departureTime,
  driverId,
  enabled = true,
  messages = [],
  passengers = [],
  role,
  socket,
  userId,
}: UseVibeCheckHandshakeOptions) => {
  const [state, setState] = useState<VibeCheckHandshakeState>(() =>
    getInitialHandshakeState(carpoolId, departureTime)
  );

  const scopedPassengers = useMemo(() => {
    const acceptedPassengers = passengers.filter(
      (passenger) => !passenger.status || passenger.status === "ACCEPTED"
    );

    if (
      role === "rider" &&
      userId &&
      !acceptedPassengers.some((passenger) => passenger.id === userId)
    ) {
      return [...acceptedPassengers, { id: userId, status: "ACCEPTED" }];
    }

    return acceptedPassengers;
  }, [passengers, role, userId]);

  const fallbackPassengerId =
    scopedPassengers.length === 1 ? scopedPassengers[0]?.id : null;
  const parsedMessagePatches = useMemo(() => {
    const patches = messages.flatMap((message) => {
      const patch = parseVibeCheckMessage(
        message,
        driverId,
        fallbackPassengerId
      );

      return patch ? [patch] : [];
    });

    return {
      patches,
      signature: patches.map(getHandshakePatchSignature).join("|"),
    };
  }, [driverId, fallbackPassengerId, messages]);
  const parsedMessagePatchesRef = useRef<VibeCheckHandshakePatch[]>([]);
  parsedMessagePatchesRef.current = parsedMessagePatches.patches;

  const mergeState = useCallback(
    (incoming: VibeCheckHandshakePatch) => {
      if (!carpoolId || !incoming.passengerId) return;

      setState((current) => {
        const next: VibeCheckHandshakeState = {
          ...current,
          carpoolId,
          departureTime: departureTime ?? null,
          handshakes: {
            ...current.handshakes,
            [incoming.passengerId as string]: mergePassengerHandshake(
              current.handshakes[incoming.passengerId as string],
              incoming
            ),
          },
          updatedAt: incoming.updatedAt ?? new Date().toISOString(),
        };

        if (hasSameHandshakeProgress(current, next)) {
          return current;
        }

        return next;
      });
    },
    [carpoolId, departureTime]
  );

  useEffect(() => {
    const next = getInitialHandshakeState(carpoolId, departureTime);
    setState((current) =>
      hasSameHandshakeProgress(current, next) ? current : next
    );
  }, [carpoolId, departureTime]);

  useEffect(() => {
    if (!enabled || parsedMessagePatches.signature.length === 0) return;

    parsedMessagePatchesRef.current.forEach((patch) => mergeState(patch));
  }, [enabled, mergeState, parsedMessagePatches.signature]);

  useEffect(() => {
    if (!enabled || !socket || !carpoolId) return;

    const handleUpdate = (payload: any) => {
      if (payload?.carpoolId !== carpoolId) return;

      const patch = getPatchFromSocketPayload(payload, fallbackPassengerId);
      if (patch) mergeState(patch);
    };

    socket.on(VIBE_CHECK_SOCKET_UPDATE_EVENT, handleUpdate);
    socket.on(VIBE_CHECK_SOCKET_EVENT, handleUpdate);

    return () => {
      socket.off(VIBE_CHECK_SOCKET_UPDATE_EVENT, handleUpdate);
      socket.off(VIBE_CHECK_SOCKET_EVENT, handleUpdate);
    };
  }, [carpoolId, enabled, fallbackPassengerId, mergeState, socket]);

  const passengerHandshakes = useMemo<VibeCheckPassengerHandshake[]>(() => {
    return scopedPassengers.map((passenger, index) => {
      const handshake =
        state.handshakes[passenger.id] ??
        getEmptyPassengerHandshake(passenger.id);
      const poolerConfirmed = Boolean(handshake.poolerConfirmedAt);
      const riderConfirmed = Boolean(handshake.riderConfirmedAt);
      const isComplete = poolerConfirmed && riderConfirmed;
      const currentUserConfirmed =
        role === "pooler"
          ? poolerConfirmed
          : role === "rider" && passenger.id === userId
            ? riderConfirmed
            : false;

      return {
        ...handshake,
        currentUserConfirmed,
        isComplete,
        label: getPassengerLabel(passenger, index, userId),
        passengerAvatar: passenger.avatar,
        poolerConfirmed,
        riderConfirmed,
        waitingForLabel: poolerConfirmed ? "Rider" : "Pooler",
      };
    });
  }, [role, scopedPassengers, state.handshakes, userId]);

  const getPassengerHandshake = useCallback(
    (passengerId?: string | null) => {
      const resolvedPassengerId =
        passengerId ||
        (role === "rider" ? userId : activePassengerId) ||
        fallbackPassengerId;
      if (!resolvedPassengerId) return null;

      return (
        passengerHandshakes.find(
          (handshake) => handshake.passengerId === resolvedPassengerId
        ) ?? null
      );
    },
    [
      activePassengerId,
      fallbackPassengerId,
      passengerHandshakes,
      role,
      userId,
    ]
  );

  const activeHandshake = getPassengerHandshake();
  const passengerCount = passengerHandshakes.length;
  const completedCount = passengerHandshakes.filter(
    (handshake) => handshake.isComplete
  ).length;
  const allPoolerConfirmed =
    passengerCount > 0 &&
    passengerHandshakes.every((handshake) => handshake.poolerConfirmed);
  const allRidersConfirmed =
    passengerCount > 0 &&
    passengerHandshakes.every((handshake) => handshake.riderConfirmed);

  const poolerConfirmed =
    role === "pooler"
      ? allPoolerConfirmed
      : Boolean(activeHandshake?.poolerConfirmed);
  const riderConfirmed =
    role === "pooler"
      ? allRidersConfirmed
      : Boolean(activeHandshake?.riderConfirmed);
  const isComplete =
    role === "pooler"
      ? passengerCount > 0 && completedCount === passengerCount
      : Boolean(activeHandshake?.isComplete);
  const currentUserConfirmed =
    role === "pooler"
      ? allPoolerConfirmed
      : role === "rider"
        ? Boolean(activeHandshake?.riderConfirmed)
        : false;
  const waitingForLabel =
    role === "pooler"
      ? allPoolerConfirmed
        ? "Riders"
        : "Pooler"
      : activeHandshake?.poolerConfirmed
        ? "Rider"
        : "Pooler";

  const confirm = useCallback((options?: VibeCheckConfirmOptions) => {
    if (!enabled || !carpoolId || role === "member") {
      return false;
    }

    const targetPassengerId =
      options?.passengerId ||
      (role === "rider" ? userId : activePassengerId) ||
      fallbackPassengerId;
    if (!targetPassengerId) return false;

    const targetPassengerHandshake = passengerHandshakes.find(
      (handshake) => handshake.passengerId === targetPassengerId
    );
    const targetHandshake =
      targetPassengerHandshake ?? getEmptyPassengerHandshake(targetPassengerId);
    const alreadyConfirmed =
      role === "pooler"
        ? Boolean(targetHandshake.poolerConfirmedAt)
        : Boolean(targetHandshake.riderConfirmedAt);
    if (alreadyConfirmed) return false;

    const confirmedAt = new Date().toISOString();
    const actorLabel = role === "pooler" ? "Pooler" : "Rider";
    const signalAction = options?.signalAction;
    const signalTitle = options?.signalTitle;
    const patch =
      role === "pooler"
        ? {
            passengerId: targetPassengerId,
            poolerConfirmedAt: confirmedAt,
            poolerUserId: userId ?? null,
          }
        : {
            passengerId: targetPassengerId,
            riderConfirmedAt: confirmedAt,
            riderUserId: userId ?? null,
          };

    mergeState(patch);
    socket?.emit(VIBE_CHECK_SOCKET_EVENT, {
      carpoolId,
      confirmedAt,
      departureTime: departureTime ?? null,
      notification: signalTitle
        ? {
            body: `${actorLabel} says ${signalAction}. Tap to complete your side.`,
            title: `${signalTitle} needs your response`,
          }
        : undefined,
      passengerId: targetPassengerId,
      role,
      signalAction,
      signalTitle,
      userId,
    });

    return {
      passengerId: targetPassengerId,
      passengerLabel:
        options?.passengerLabel ||
        targetPassengerHandshake?.label ||
        (role === "rider" ? "You" : null),
      role,
    };
  }, [
    activePassengerId,
    carpoolId,
    departureTime,
    enabled,
    fallbackPassengerId,
    mergeState,
    passengerHandshakes,
    role,
    socket,
    userId,
  ]);

  return {
    activeHandshake,
    completedCount,
    confirm,
    currentUserConfirmed,
    getPassengerHandshake,
    isComplete,
    passengerCount,
    passengerHandshakes,
    poolerConfirmed,
    riderConfirmed,
    role,
    state,
    waitingForLabel,
  };
};
