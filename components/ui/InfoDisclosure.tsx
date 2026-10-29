import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function InfoDisclosure({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  const { tw, color } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`About ${label.toLowerCase()}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={tw`min-h-11 max-w-full flex-row items-center gap-2 self-start`}
      >
        <Text style={tw`shrink text-sm text-secondary dark:text-[#AFC0F4]`}>
          {label}
        </Text>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={color("#0FF1CF", "accent")}
        />
      </TouchableOpacity>
      {expanded ? (
        <Text style={tw`text-sm leading-6 text-secondary dark:text-[#AFC0F4]`}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
