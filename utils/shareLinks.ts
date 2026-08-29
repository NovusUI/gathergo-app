export const GATHERGO_SHARE_ORIGIN = "https://gathergo.events";

const cleanPathPart = (value: string) => encodeURIComponent(value.trim());

export const buildGatherGoShareLink = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${GATHERGO_SHARE_ORIGIN}${normalizedPath}`;
};

export const buildEventShareLink = (eventId?: string | null) =>
  eventId ? buildGatherGoShareLink(`/event/${cleanPathPart(eventId)}`) : GATHERGO_SHARE_ORIGIN;

export const buildCarpoolShareLink = (carpoolId?: string | null) =>
  carpoolId
    ? buildGatherGoShareLink(`/carpool/${cleanPathPart(carpoolId)}`)
    : buildGatherGoShareLink("/carpool");
