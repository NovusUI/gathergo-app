import { useAppTheme } from "@/hooks/useAppTheme";
import CustomButton from "@/components/buttons/CustomBtn1";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function EventDraftPrompt({
  title,
  busy,
  onContinue,
  onDiscard,
}: {
  title: string;
  busy: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  const { tw } = useAppTheme();
  return (
    <ScrollView contentContainerStyle={tw`grow justify-center px-6 py-8`}>
      <MascotMoment
        layout="stacked"
        title="Continue your event?"
        message={
          title.trim()
            ? `“${title.trim()}” is waiting for you.`
            : "Your unfinished event is waiting for you."
        }
      />
      <View style={tw`gap-3`}>
        <CustomButton
          title="Continue draft"
          disabled={busy}
          onPress={onContinue}
          showArrow={false}
          buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none"
          textClassName="!text-onAccent dark:text-black"
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onDiscard}
          style={tw`min-h-[48px] items-center justify-center px-4 py-3`}
        >
          <Text style={tw`text-center text-sm font-semibold text-danger dark:text-[#FFADAD]`}>
            {busy ? "Discarding draft…" : "Discard draft and start over"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
