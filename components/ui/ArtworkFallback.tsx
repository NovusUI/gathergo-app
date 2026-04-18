import { Registration } from "@/types/auth";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import tw from "twrnc";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type EventVisualConfig = {
  icon: IoniconName;
  title: string;
  subtitle: string;
  background: string;
  accent: string;
  bubble: string;
  glow: string;
  label: string;
};

type NotificationVisualConfig = {
  icon: IoniconName;
  title: string;
  background: string;
  accent: string;
  bubble: string;
  glow: string;
};

const EVENT_VISUALS: Record<Registration, EventVisualConfig> = {
  ticket: {
    icon: "ticket-outline",
    title: "Ticket event",
    subtitle: "Seats, access, and a live turnout all start here.",
    background: "#0A173F",
    accent: "#0FF1CF",
    bubble: "rgba(15, 241, 207, 0.18)",
    glow: "rgba(86, 105, 255, 0.24)",
    label: "Tickets",
  },
  donation: {
    icon: "heart-outline",
    title: "Donation event",
    subtitle: "Giving momentum deserves a cover that still feels alive.",
    background: "#23103A",
    accent: "#FF8AAE",
    bubble: "rgba(255, 138, 174, 0.18)",
    glow: "rgba(255, 107, 107, 0.24)",
    label: "Impact",
  },
  registration: {
    icon: "clipboard-outline",
    title: "Registration event",
    subtitle: "RSVP, planning, and community energy still have a place here.",
    background: "#10243C",
    accent: "#FFD166",
    bubble: "rgba(255, 209, 102, 0.18)",
    glow: "rgba(49, 198, 246, 0.22)",
    label: "RSVP",
  },
};

const getEventVisual = (
  registrationType?: Registration | null
): EventVisualConfig => {
  if (!registrationType) {
    return EVENT_VISUALS.registration;
  }

  return EVENT_VISUALS[registrationType] || EVENT_VISUALS.registration;
};

const getNotificationVisual = (
  notificationType?: string
): NotificationVisualConfig => {
  const normalized = (notificationType || "").toLowerCase();

  if (normalized.includes("carpool")) {
    return {
      icon: "car-sport-outline",
      title: "Carpool",
      background: "#10243C",
      accent: "#31C6F6",
      bubble: "rgba(49, 198, 246, 0.18)",
      glow: "rgba(15, 241, 207, 0.18)",
    };
  }

  if (
    normalized.includes("donation") ||
    normalized.includes("ticket") ||
    normalized.includes("registration") ||
    normalized.includes("event") ||
    normalized.includes("feed")
  ) {
    return {
      icon: "sparkles-outline",
      title: "Event",
      background: "#0A173F",
      accent: "#0FF1CF",
      bubble: "rgba(15, 241, 207, 0.18)",
      glow: "rgba(86, 105, 255, 0.24)",
    };
  }

  if (
    normalized.includes("wallet") ||
    normalized.includes("kyc") ||
    normalized.includes("payout")
  ) {
    return {
      icon: "wallet-outline",
      title: "Wallet",
      background: "#22143B",
      accent: "#F1D417",
      bubble: "rgba(241, 212, 23, 0.18)",
      glow: "rgba(255, 147, 46, 0.18)",
    };
  }

  if (
    normalized.includes("scanner") ||
    normalized.includes("validation") ||
    normalized.includes("permission")
  ) {
    return {
      icon: "scan-outline",
      title: "Access",
      background: "#14253C",
      accent: "#7CC5FF",
      bubble: "rgba(124, 197, 255, 0.18)",
      glow: "rgba(49, 198, 246, 0.16)",
    };
  }

  if (normalized.includes("message") || normalized.includes("chat")) {
    return {
      icon: "chatbubble-ellipses-outline",
      title: "Message",
      background: "#1A1C48",
      accent: "#A78BFA",
      bubble: "rgba(167, 139, 250, 0.18)",
      glow: "rgba(86, 105, 255, 0.16)",
    };
  }

  return {
    icon: "notifications-outline",
    title: "Update",
    background: "#16233E",
    accent: "#0FF1CF",
    bubble: "rgba(15, 241, 207, 0.18)",
    glow: "rgba(255, 209, 102, 0.12)",
  };
};

export const EventArtworkFallback = ({
  registrationType,
  height,
  borderRadius = 0,
  compact = false,
}: {
  registrationType?: Registration | null;
  height: number;
  borderRadius?: number;
  compact?: boolean;
}) => {
  const visual = getEventVisual(registrationType);

  return (
    <View
      style={[
        tw`w-full overflow-hidden items-center justify-center`,
        {
          height,
          borderRadius,
          backgroundColor: visual.background,
        },
      ]}
    >
      <View
        style={{
          position: "absolute",
          top: compact ? -18 : -30,
          right: compact ? -10 : -24,
          width: compact ? 70 : 120,
          height: compact ? 70 : 120,
          borderRadius: 999,
          backgroundColor: visual.glow,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: compact ? -22 : -30,
          left: compact ? -16 : -24,
          width: compact ? 84 : 140,
          height: compact ? 84 : 140,
          borderRadius: 999,
          backgroundColor: visual.bubble,
        }}
      />

      <View style={tw`items-center px-4`}>
        <View
          style={[
            tw`items-center justify-center rounded-full`,
            {
              width: compact ? 42 : 74,
              height: compact ? 42 : 74,
              backgroundColor: visual.bubble,
            },
          ]}
        >
          <Ionicons
            name={visual.icon}
            size={compact ? 20 : 34}
            color={visual.accent}
          />
        </View>
        <Text
          style={[
            tw`mt-3 font-semibold text-white`,
            compact ? tw`text-[11px]` : tw`text-lg`,
          ]}
          numberOfLines={1}
        >
          {compact ? visual.label : visual.title}
        </Text>
        {!compact && (
          <Text
            style={tw`mt-2 text-center text-sm leading-5 text-[#C6D5F2]`}
          >
            {visual.subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

export const NotificationArtworkFallback = ({
  notificationType,
  height,
  width,
  borderRadius = 8,
}: {
  notificationType?: string;
  height: number;
  width: number;
  borderRadius?: number;
}) => {
  const visual = getNotificationVisual(notificationType);

  return (
    <View
      style={[
        tw`overflow-hidden items-center justify-center`,
        {
          width,
          height,
          borderRadius,
          backgroundColor: visual.background,
        },
      ]}
    >
      <View
        style={{
          position: "absolute",
          top: -16,
          right: -10,
          width: 56,
          height: 56,
          borderRadius: 999,
          backgroundColor: visual.glow,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -18,
          left: -10,
          width: 62,
          height: 62,
          borderRadius: 999,
          backgroundColor: visual.bubble,
        }}
      />

      <View
        style={[
          tw`items-center justify-center rounded-full`,
          {
            width: 36,
            height: 36,
            backgroundColor: visual.bubble,
          },
        ]}
      >
        <Ionicons name={visual.icon} size={18} color={visual.accent} />
      </View>
      <Text style={tw`mt-2 text-[10px] font-semibold uppercase text-white`}>
        {visual.title}
      </Text>
    </View>
  );
};
