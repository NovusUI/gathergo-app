import type { ShortLinkKind } from "@/types/shortLink";

export const GATHERGO_SHARE_ORIGIN = "https://gathergo.events";

const cleanPathPart = (value: string) => encodeURIComponent(value.trim());

export const buildGatherGoShareLink = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${GATHERGO_SHARE_ORIGIN}${normalizedPath}`;
};

export const buildEventShareLink = (eventId?: string | null) =>
  eventId
    ? buildGatherGoShareLink(`/event/${cleanPathPart(eventId)}`)
    : GATHERGO_SHARE_ORIGIN;

export const buildCarpoolShareLink = (carpoolId?: string | null) =>
  carpoolId
    ? buildGatherGoShareLink(`/carpool/${cleanPathPart(carpoolId)}`)
    : buildGatherGoShareLink("/carpool");

export const buildFoodBankShareLink = (eventId: string) =>
  buildGatherGoShareLink(`/food-bank/${cleanPathPart(eventId)}`);

export const buildShortShareLink = (code: string) =>
  buildGatherGoShareLink(`/s/${cleanPathPart(code)}`);

export function buildShareTargetRoute(kind: ShortLinkKind, targetId: string) {
  const paths = {
    event: "/event",
    foodbank: "/food-bank",
    carpool: "/carpool",
  } as const;
  return `${paths[kind]}/${cleanPathPart(targetId)}` as const;
}

type ScannedDestination =
  | { kind: ShortLinkKind; id: string }
  | { kind: "short"; code: string };

export function resolveScannedLink(value: string): ScannedDestination | null {
  try {
    const url = new URL(value);
    if (url.origin !== GATHERGO_SHARE_ORIGIN) return null;
    const short = /^\/s\/([A-Za-z0-9_-]{8})\/?$/.exec(url.pathname);
    if (short) return { kind: "short", code: short[1] };
    const match = /^\/(event|food-bank|carpool)\/([^/]+)\/?$/.exec(
      url.pathname,
    );
    if (!match) return null;
    const id = decodeURIComponent(match[2]);
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
    return {
      kind:
        match[1] === "food-bank"
          ? "foodbank"
          : match[1] === "event"
            ? "event"
            : "carpool",
      id,
    };
  } catch {
    return null;
  }
}
