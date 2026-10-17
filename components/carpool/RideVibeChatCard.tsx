import { Ionicons } from "@expo/vector-icons";
import { GatherGoMascot } from "@/components/ui/GatherGoMascot";
import type {
  CarpoolVibeDialogMessage,
  CarpoolVibeMascotStyle,
  CarpoolVibeSafetySignal,
} from "@/constants/carpool";
import { getCarpoolVibeSafetyRoleCopy } from "@/constants/carpool";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const EMPTY_DIALOG_MESSAGE: CarpoolVibeDialogMessage = [];

interface RideVibeChatCardProps {
  dialogKey: string;
  dialogMessages: CarpoolVibeDialogMessage[];
  expanded: boolean;
  iconName: IoniconName;
  label: string;
  mascotStyle: CarpoolVibeMascotStyle;
  onOpenVibeCheck?: () => void;
  onToggle: () => void;
  roleLabel: string;
  safetySignal: CarpoolVibeSafetySignal;
  vibeCheckButtonLabel?: string;
}

interface VibeTypingDialogProps {
  accentColor: string;
  onComplete?: () => void;
  parts: CarpoolVibeDialogMessage;
  speedMs?: number;
  textKey: string;
}

const getDialogText = (parts: CarpoolVibeDialogMessage) =>
  parts.map((part) => part.text).join("");

const getVisibleDialogParts = (
  parts: CarpoolVibeDialogMessage,
  visibleCharacters: number
) => {
  let remainingCharacters = visibleCharacters;

  return parts.flatMap((part) => {
    if (remainingCharacters <= 0) return [];

    const visibleText = part.text.slice(0, remainingCharacters);
    remainingCharacters -= part.text.length;

    return visibleText ? [{ ...part, text: visibleText }] : [];
  });
};

const VibeTypingDialog = ({
  accentColor,
  onComplete,
  parts,
  speedMs = 22,
  textKey,
}: VibeTypingDialogProps) => {
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const fullText = useMemo(() => getDialogText(parts), [parts]);
  const visibleParts = useMemo(
    () => getVisibleDialogParts(parts, visibleCharacters),
    [parts, visibleCharacters]
  );
  const isTyping = visibleCharacters < fullText.length;

  useEffect(() => {
    setVisibleCharacters(0);

    if (!fullText) return undefined;

    const typingInterval = setInterval(() => {
      setVisibleCharacters((current) => {
        const next = Math.min(current + 1, fullText.length);
        if (next >= fullText.length) clearInterval(typingInterval);

        return next;
      });
    }, speedMs);

    return () => clearInterval(typingInterval);
  }, [fullText, speedMs, textKey]);

  useEffect(() => {
    if (!fullText || visibleCharacters < fullText.length) return undefined;

    const completeTimeout = setTimeout(() => onComplete?.(), 4200);

    return () => clearTimeout(completeTimeout);
  }, [fullText, onComplete, visibleCharacters]);

  return (
    <Text style={tw`text-white text-sm leading-5`}>
      {visibleParts.map((part, index) => (
        <Text
          key={`${index}-${part.highlight ? "highlight" : "text"}`}
          style={
            part.highlight
              ? { color: accentColor, fontWeight: "700" }
              : undefined
          }
        >
          {part.text}
        </Text>
      ))}
      {isTyping ? <Text style={{ color: accentColor }}> |</Text> : null}
    </Text>
  );
};

export default function RideVibeChatCard({
  dialogKey,
  dialogMessages,
  expanded,
  iconName,
  label,
  mascotStyle,
  onOpenVibeCheck,
  onToggle,
  roleLabel,
  safetySignal,
  vibeCheckButtonLabel = "Complete signal",
}: RideVibeChatCardProps) {
  const safetyCopy = getCarpoolVibeSafetyRoleCopy(
    safetySignal,
    roleLabel,
    label
  );
  const [dialogMessageIndex, setDialogMessageIndex] = useState(0);
  const activeDialogMessage = useMemo(() => {
    if (dialogMessages.length === 0) return EMPTY_DIALOG_MESSAGE;

    return (
      dialogMessages[dialogMessageIndex % dialogMessages.length] ??
      EMPTY_DIALOG_MESSAGE
    );
  }, [dialogMessageIndex, dialogMessages]);
  const dialogText = useMemo(
    () => getDialogText(dialogMessages[0] ?? EMPTY_DIALOG_MESSAGE),
    [dialogMessages]
  );
  const activeDialogMessageText = useMemo(
    () => getDialogText(activeDialogMessage),
    [activeDialogMessage]
  );
  const handleDialogComplete = useCallback(() => {
    if (dialogMessages.length <= 1) return;

    setDialogMessageIndex((current) => (current + 1) % dialogMessages.length);
  }, [dialogMessages.length]);

  useEffect(() => {
    setDialogMessageIndex(0);
  }, [dialogKey]);

  return (
    <View
      style={[
        tw`rounded-3xl border overflow-hidden`,
        {
          backgroundColor: mascotStyle.cardBackground,
          borderColor: mascotStyle.cardBorder,
        },
      ]}
    >
      {expanded ? (
        <View style={tw`absolute top-0 left-0 right-0 h-1 flex-row`}>
          <View
            style={[tw`flex-1`, { backgroundColor: mascotStyle.accent }]}
          />
          <View style={[tw`flex-1`, { backgroundColor: mascotStyle.body }]} />
          <View
            style={[tw`flex-1`, { backgroundColor: mascotStyle.badgeBg }]}
          />
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        onPress={onToggle}
        style={[tw`flex-row gap-3 p-4`, expanded ? tw`pt-5` : null]}
      >
        <GatherGoMascot
          animated
          badgeContent={
            <Ionicons
              name={iconName}
              size={expanded ? 14 : 12}
              color={mascotStyle.iconColor}
            />
          }
          palette={mascotStyle}
          size={expanded ? 74 : 58}
          style={{ flexShrink: 0 }}
          variant={mascotStyle.variant}
        />

        <View style={tw`flex-1 min-w-0`}>
          <View style={tw`flex-row items-center justify-between gap-2`}>
            <Text
              style={[tw`text-xs`, { color: mascotStyle.accent }]}
              numberOfLines={1}
            >
              {label} ride vibe
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={mascotStyle.accent}
            />
          </View>

          {expanded ? (
            <View
              style={[
                tw`mt-2 rounded-2xl border px-3 py-3`,
                {
                  backgroundColor: mascotStyle.dialogBackground,
                  borderColor: mascotStyle.cardBorder,
                  minHeight: 74,
                },
              ]}
            >
              <VibeTypingDialog
                accentColor={mascotStyle.accent}
                onComplete={handleDialogComplete}
                parts={activeDialogMessage}
                textKey={`${dialogKey}:${dialogMessageIndex}:${activeDialogMessageText}`}
              />
            </View>
          ) : (
            <Text
              style={[tw`text-white text-sm leading-5 mt-1`, { minHeight: 40 }]}
              numberOfLines={2}
            >
              {dialogText}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={tw`px-4 pb-4`}>
          <View
            style={[
              tw`pt-3 border-t gap-3`,
              { borderColor: mascotStyle.cardBorder },
            ]}
          >
            <View style={tw`flex-row items-center justify-between gap-3`}>
              <View style={tw`flex-1 min-w-0`}>
                <Text style={tw`text-white text-sm font-semibold`}>
                  Handshake flow
                </Text>
                <Text style={tw`text-[#A8BAE4] text-xs mt-1`}>
                  {safetySignal.title}
                </Text>
              </View>
              <View
                style={[
                  tw`h-9 w-9 rounded-full items-center justify-center`,
                  { backgroundColor: mascotStyle.dialogBackground },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={mascotStyle.accent}
                />
              </View>
            </View>

            <View style={tw`flex-row gap-2`}>
              <View
                style={[
                  tw`flex-1 rounded-2xl border p-3`,
                  {
                    backgroundColor: mascotStyle.dialogBackground,
                    borderColor: mascotStyle.cardBorder,
                    height: 76,
                  },
                ]}
              >
                <Text style={tw`text-[#8FA5E2] text-xs`} numberOfLines={1}>
                  {safetyCopy.primarySignalLabel}
                </Text>
                <Text
                  style={[
                    tw`text-xs font-semibold mt-1`,
                    { color: mascotStyle.accent },
                  ]}
                  numberOfLines={2}
                >
                  {safetyCopy.primarySignalValue}
                </Text>
              </View>
              <View
                style={[
                  tw`flex-1 rounded-2xl border p-3`,
                  {
                    backgroundColor: mascotStyle.dialogBackground,
                    borderColor: mascotStyle.cardBorder,
                    height: 76,
                  },
                ]}
              >
                <Text style={tw`text-[#8FA5E2] text-xs`} numberOfLines={1}>
                  {safetyCopy.secondarySignalLabel}
                </Text>
                <Text
                  style={[
                    tw`text-xs font-semibold mt-1`,
                    { color: mascotStyle.badgeBg },
                  ]}
                  numberOfLines={2}
                >
                  {safetyCopy.secondarySignalValue}
                </Text>
              </View>
            </View>

            {onOpenVibeCheck ? (
              <TouchableOpacity
                activeOpacity={0.86}
                accessibilityRole="button"
                onPress={onOpenVibeCheck}
                style={[
                  tw`h-12 flex-row items-center justify-center gap-2 rounded-2xl border`,
                  {
                    backgroundColor: mascotStyle.badgeBg,
                    borderColor: mascotStyle.badgeBg,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color="#01082E"
                />
                <Text style={tw`text-[#01082E] text-sm font-semibold`}>
                  {vibeCheckButtonLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
