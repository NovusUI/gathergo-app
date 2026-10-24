import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import { useAppTheme } from "@/hooks/useAppTheme";
import { X } from "lucide-react-native";
import { useEffect } from "react";
import {
  AccessibilityInfo,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from "react-native-toast-message";

const TOAST_TONES = {
  success: {
    title: "Success",
    variant: "success",
    accent: "success",
    background: "successSoft",
  },
  error: {
    title: "Error",
    variant: "error",
    accent: "danger",
    background: "dangerSoft",
  },
  warn: {
    title: "Warning",
    variant: "pending",
    accent: "warning",
    background: "warningSoft",
  },
  info: {
    title: "A note from Gogo",
    variant: "idle",
    accent: "info",
    background: "infoSoft",
  },
} as const;

type GogoToastProps = Pick<
  ToastConfigParams<never>,
  "text1" | "text2" | "isVisible" | "hide" | "onPress"
> & {
  tone: keyof typeof TOAST_TONES;
};

export function GogoToast({
  tone,
  text1,
  text2,
  isVisible,
  hide,
  onPress,
}: GogoToastProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const appearance = TOAST_TONES[tone];
  const title = text1 || appearance.title;
  const announcement = [title, text2].filter(Boolean).join(". ");

  useEffect(() => {
    if (isVisible && Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [announcement, isVisible]);

  return (
    <View
      style={{
        width: Math.min(width - insets.left - insets.right - 32, 560),
        marginLeft: insets.left,
        marginRight: insets.right,
        padding: 14,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={announcement}
        accessibilityHint="Dismiss notification"
        accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
        onPress={() => {
          onPress();
          hide();
        }}
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            borderRadius: 18,
            backgroundColor: colors[appearance.background],
            padding: 2,
          }}
        >
          <GatherGoMascot
            variant={appearance.variant}
            size={54}
            animated={isVisible}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              color: colors[appearance.accent],
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            GOGO
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 16,
              fontWeight: "700",
              marginTop: 3,
            }}
          >
            {title}
          </Text>
          {text2 ? (
            <Text
              style={{ color: colors.secondary, fontSize: 14, marginTop: 4 }}
            >
              {text2}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={8}
        onPress={() => hide()}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <GogoToast {...props} tone="success" />,
  error: (props) => <GogoToast {...props} tone="error" />,
  warn: (props) => <GogoToast {...props} tone="warn" />,
  info: (props) => <GogoToast {...props} tone="info" />,
};

export default function AppToast() {
  const insets = useSafeAreaInsets();
  return (
    <Toast
      config={toastConfig}
      topOffset={insets.top + 12}
      bottomOffset={insets.bottom + 12}
    />
  );
}
