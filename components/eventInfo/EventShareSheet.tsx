import { useRef, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";
import type Svg from "react-native-svg";
import { shareEventImage } from "@/utils/shareEventImage";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useShortShareLink } from "@/services/queries";
import AppLoader from "@/components/ui/AppLoader";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import CustomButton from "@/components/buttons/CustomBtn1";
import { EventImageWithProcessing } from "@/components/EventImageWithProcessing";

export default function EventShareSheet({
  visible,
  onClose,
  eventId,
  title,
  foodBank,
  imageUrl,
}: {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  title: string;
  foodBank: boolean;
  imageUrl?: string | null;
}) {
  const { tw, color } = useAppTheme();
  const [sharingQr, setSharingQr] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const [kind, setKind] = useState<"event" | "foodbank">("event");
  const svg = useRef<Svg | null>(null);
  const sharing = sharingQr || sharingImage;
  const collection = foodBank && kind === "foodbank";
  const linkQuery = useShortShareLink(
    collection ? "foodbank" : "event",
    eventId,
    visible,
  );
  const link = linkQuery.data;
  const canShare = Boolean(link) && !sharing;
  const label = collection ? "Meal collection" : "Event page";
  const shareLink = async () => {
    if (!link || sharing) return;
    try {
      await Share.share({
        title: `${title} · ${label}`,
        message: `${title} · ${label}\n${link}`,
      });
    } catch {
      showGlobalError("Could not open sharing. Please try again.");
    }
  };
  const shareCover = async () => {
    if (!imageUrl || !link || sharing) return;
    setSharingImage(true);
    try {
      await shareEventImage({ imageUrl, title: `${title} · ${label}`, link });
    } catch (error) {
      console.warn("Event image sharing failed", error);
      showGlobalError(
        error instanceof Error
          ? error.message
          : "Could not share the event image. Please try again.",
      );
    } finally {
      setSharingImage(false);
    }
  };
  const copyLink = async () => {
    if (!link) return;
    try {
      const copied = await Clipboard.setStringAsync(link);
      if (!copied) throw new Error("Clipboard unavailable");
      showGlobalSuccess("Link copied");
    } catch {
      showGlobalError("Could not copy the link. Please try again.");
    }
  };
  const shareQr = async () => {
    const qrSvg = svg.current;
    if (!link || sharing || !qrSvg) return;
    setSharingQr(true);
    let path: string | null = null;
    try {
      if (!(await Sharing.isAvailableAsync()) || !FileSystem.cacheDirectory) {
        showGlobalError(
          "Image sharing is unavailable on this device. You can copy the QR image or share the link.",
        );
        return;
      }
      const base64 = await new Promise<string>((resolve) =>
        qrSvg.toDataURL(resolve),
      );
      path = `${FileSystem.cacheDirectory}gathergo-${eventId}-${collection ? "meals" : "event"}.png`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(path, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: `${title} · ${label}`,
      });
    } catch {
      showGlobalError("Could not share the QR image. Please try again.");
    } finally {
      if (path)
        await FileSystem.deleteAsync(path, { idempotent: true }).catch(
          (error) => console.warn("QR cache cleanup failed", error),
        );
      setSharingQr(false);
    }
  };
  const copyQr = () => {
    if (!link || !svg.current) return;
    svg.current.toDataURL((base64) => {
      void Clipboard.setImageAsync(base64)
        .then(() =>
          showGlobalSuccess("QR image copied. Paste it into your message."),
        )
        .catch(() => showGlobalError("Could not copy the QR image."));
    });
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
        <ScrollView
          contentContainerStyle={tw`p-6 gap-5 w-full max-w-[600px] self-center`}
        >
          <View style={tw`flex-row items-center justify-between gap-4`}>
            <Text
              style={tw`text-foreground dark:text-white text-xl font-semibold`}
            >
              Share event
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close sharing"
              style={tw`p-3`}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={24}
                color={color("white", "foreground")}
              />
            </TouchableOpacity>
          </View>
          {foodBank ? (
            <View style={tw`flex-row gap-3`}>
              {(["event", "foodbank"] as const).map((value) => (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: kind === value,
                    disabled: sharing,
                  }}
                  disabled={sharing}
                  onPress={() => setKind(value)}
                  style={tw.style(
                    "flex-1 rounded-2xl border p-4",
                    kind === value
                      ? "border-accent bg-accentFill/10"
                      : "border-border",
                  )}
                >
                  <Text style={tw`text-foreground dark:text-white text-center`}>
                    {value === "event" ? "Event page" : "Meal collection"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {imageUrl ? (
            <View style={tw`gap-3 overflow-hidden rounded-2xl`}>
              <EventImageWithProcessing
                imageUrl={imageUrl}
                isProcessing={false}
                height={190}
              />
              <Text
                style={tw`text-secondary dark:text-[#AFC0F4] text-center text-sm`}
              >
                Event cover
              </Text>
              {Platform.OS !== "web" ? (
                <CustomButton
                  title={
                    sharingImage ? "Preparing image…" : "Share image + link"
                  }
                  disabled={!canShare}
                  onPress={() => void shareCover()}
                  showArrow={false}
                  buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0"
                  textClassName="!text-onAccent dark:text-black"
                />
              ) : null}
            </View>
          ) : null}
          <View
            style={tw`rounded-3xl bg-surface dark:bg-[#101C45] items-center p-6 gap-4`}
          >
            <Text
              style={tw`text-foreground dark:text-white text-center text-xl font-semibold`}
            >
              {title}
            </Text>
            <Text style={tw`text-accent dark:text-[#0FF1CF] font-semibold`}>
              {label}
            </Text>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                padding: 20,
                borderRadius: 20,
              }}
            >
              {link ? (
                <QRCode
                  key={link}
                  value={link}
                  size={210}
                  color="#01082E"
                  backgroundColor="#FFFFFF"
                  quietZone={12}
                  ecl="H"
                  logoSize={42}
                  logoMargin={3}
                  logoBackgroundColor="#FFFFFF"
                  logoSVG={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42"><rect width="42" height="42" fill="white"/><text x="21" y="24" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="9" fill="#01082E">${collection ? "MEALS" : "EVENT"}</text></svg>`}
                  getRef={(ref: Svg) => {
                    svg.current = ref;
                  }}
                />
              ) : linkQuery.isError ? (
                <View style={tw`gap-3 items-center max-w-[210px]`}>
                  <Text style={tw`text-center text-[#01082E]`}>
                    Couldn’t create a short link.
                  </Text>
                  <CustomButton
                    title="Retry link"
                    onPress={() => void linkQuery.refetch()}
                    showArrow={false}
                    textClassName="!text-[#01082E]"
                  />
                </View>
              ) : (
                <View style={tw`gap-3 items-center p-6`}>
                  <AppLoader tone="accent" />
                  <Text style={tw`text-[#01082E]`}>Preparing link…</Text>
                </View>
              )}
            </View>
            {link ? (
              <Text
                selectable
                style={tw`text-secondary dark:text-[#AFC0F4] text-center text-sm`}
              >
                {link}
              </Text>
            ) : null}
            <Text
              style={tw`text-secondary dark:text-[#AFC0F4] text-center leading-6`}
            >
              {collection
                ? "Scan to reserve a meal and receive your collection window."
                : "Scan to open the event, see details and take part."}
            </Text>
          </View>
          <CustomButton
            title="Share link"
            disabled={!canShare}
            onPress={() => void shareLink()}
            showArrow={false}
          />
          <CustomButton
            title="Copy link"
            disabled={!link}
            onPress={() => void copyLink()}
            showArrow={false}
          />
          {Platform.OS !== "web" ? (
            <CustomButton
              title={sharingQr ? "Sharing QR image…" : "Share QR image"}
              disabled={!canShare}
              onPress={() => void shareQr()}
              showArrow={false}
            />
          ) : null}
          {Platform.OS !== "web" ? (
            <CustomButton
              title="Copy QR image"
              disabled={!link}
              onPress={copyQr}
              showArrow={false}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
