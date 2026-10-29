import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { MealPass } from "@/types/foodBank";
import { formatEventDateTime } from "@/utils/dateTimeHandler";

export default function MealPassCard({
  pass,
  title,
  location,
}: {
  pass: MealPass;
  title: string;
  location: string | null;
}) {
  const { tw, color } = useAppTheme();
  return (
    <View
      style={tw`rounded-3xl bg-surface dark:bg-[#101C45] border border-border dark:border-[#24345A] p-6 gap-5 items-center`}
    >
      <Ionicons
        name="restaurant-outline"
        size={28}
        color={color("#0FF1CF", "accent")}
      />
      <Text
        style={tw`text-foreground dark:text-white text-xl font-semibold text-center`}
      >
        {title}
      </Text>
      <Text style={tw`text-accent dark:text-[#0FF1CF] font-semibold`}>
        {pass.isUsed ? "Meal collected" : "Meal collection pass"}
      </Text>
      <View
        style={{ backgroundColor: "#FFFFFF", padding: 20, borderRadius: 20 }}
      >
        <QRCode
          value={pass.qrCode}
          size={190}
          color="#01082E"
          backgroundColor="#FFFFFF"
        />
      </View>
      <Text
        style={tw`text-foreground dark:text-white text-center font-semibold`}
      >
        Suggested arrival window
      </Text>
      <Text style={tw`text-foreground dark:text-white text-center`}>
        {formatEventDateTime(pass.collectionStart, pass.collectionEnd, pass.timeZone)}
      </Text>
      {location ? (
        <Text style={tw`text-secondary dark:text-[#AFC0F4] text-center`}>
          {location}
        </Text>
      ) : null}
      <Text
        style={tw`text-secondary dark:text-[#AFC0F4] text-center leading-5`}
      >
        Aim to arrive during this window. The collection team can help earlier
        or later while collection is open. Each pass can be used once.
      </Text>
    </View>
  );
}
