export const normalizeNotificationLink = (
  link?: string | null,
  data?: { eventId?: string; carpoolId?: string }
) => {
  if (link && link.startsWith("/event/")) {
    return link;
  }

  if (link && link.startsWith("/events/")) {
    const path = link.replace(/^\/events\//, "");
    const [eventId, ...restParts] = path.split("/");
    const rest = restParts.join("/");

    if (!eventId) {
      return "/";
    }

    if (!rest || rest.length === 0) {
      return `/event/${eventId}`;
    }

    if (rest.startsWith("feed")) {
      return `/event/${eventId}?openFeed=1`;
    }

    return `/event/${eventId}`;
  }

  if (data?.carpoolId) {
    return `/chat/${data.carpoolId}`;
  }

  if (data?.eventId) {
    return `/event/${data.eventId}?openFeed=1`;
  }

  return link || "/";
};
