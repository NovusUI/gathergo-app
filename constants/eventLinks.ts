const EVENT_LINK_PRESETS = [
  {
    type: "whatsapp",
    label: "WhatsApp",
    subtitle: "Open WhatsApp invite",
    icon: "logo-whatsapp",
    iconColor: "#25D366",
    backgroundColor: "#0B2D1C",
    placeholder: "Paste a WhatsApp invite or group link",
    matches: ["wa.me", "chat.whatsapp.com", "whatsapp.com"],
  },
  {
    type: "instagram",
    label: "Instagram",
    subtitle: "View Instagram page",
    icon: "logo-instagram",
    iconColor: "#F472B6",
    backgroundColor: "#31132C",
    placeholder: "Paste an Instagram page or post",
    matches: ["instagram.com"],
  },
  {
    type: "twitter",
    label: "X",
    subtitle: "Open X post or profile",
    icon: "logo-twitter",
    iconColor: "#7DD3FC",
    backgroundColor: "#10283A",
    placeholder: "Paste an X / Twitter link",
    matches: ["x.com", "twitter.com"],
  },
  {
    type: "zoom",
    label: "Zoom",
    subtitle: "Join Zoom meeting",
    icon: "videocam",
    iconColor: "#60A5FA",
    backgroundColor: "#102247",
    placeholder: "Paste a Zoom meeting link",
    matches: ["zoom.us", "zoom.com"],
  },
  {
    type: "google_meet",
    label: "Google Meet",
    subtitle: "Join Google Meet",
    icon: "logo-google",
    iconColor: "#FACC15",
    backgroundColor: "#30290E",
    placeholder: "Paste a Google Meet link",
    matches: ["meet.google.com"],
  },
  {
    type: "facebook",
    label: "Facebook",
    subtitle: "Open Facebook page",
    icon: "logo-facebook",
    iconColor: "#60A5FA",
    backgroundColor: "#102247",
    placeholder: "Paste a Facebook page or event link",
    matches: ["facebook.com", "fb.me"],
  },
  {
    type: "tiktok",
    label: "TikTok",
    subtitle: "Open TikTok page",
    icon: "logo-tiktok",
    iconColor: "#F9FAFB",
    backgroundColor: "#1F2431",
    placeholder: "Paste a TikTok link",
    matches: ["tiktok.com"],
  },
  {
    type: "website",
    label: "Website",
    subtitle: "Open external link",
    icon: "globe-outline",
    iconColor: "#0FF1CF",
    backgroundColor: "#0B2D2A",
    placeholder: "Paste any useful event link",
    matches: [],
  },
] as const;

const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;

export const normalizeEventLink = (url?: string | null) => {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return "";
  }

  if (HTTP_PROTOCOL_PATTERN.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl.replace(/^\/+/, "")}`;
};

const safeParseUrl = (url: string) => {
  try {
    return new URL(normalizeEventLink(url));
  } catch {
    return null;
  }
};

export const isValidEventLink = (url?: string | null) => {
  const normalizedUrl = normalizeEventLink(url);
  if (!normalizedUrl) {
    return false;
  }

  const parsed = safeParseUrl(normalizedUrl);
  if (!parsed) {
    return false;
  }

  return (
    ["http:", "https:"].includes(parsed.protocol) &&
    (parsed.hostname.includes(".") || parsed.hostname === "localhost")
  );
};

export const getEventLinkMeta = (url?: string | null) => {
  const normalizedLink = normalizeEventLink(url);
  const parsed = safeParseUrl(normalizedLink);
  const normalizedUrl = normalizedLink.toLowerCase();
  const host = parsed?.host.replace(/^www\./, "") || "";

  const matchedPreset =
    EVENT_LINK_PRESETS.find((preset) =>
      preset.matches.some((match) => host.includes(match))
    ) || EVENT_LINK_PRESETS[EVENT_LINK_PRESETS.length - 1];

  return {
    ...matchedPreset,
    host: host || normalizedUrl.replace(/^https?:\/\//, ""),
    url: normalizedLink,
  };
};
