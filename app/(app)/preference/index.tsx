import CustomButton from "@/components/buttons/CustomBtn1";
import { useAuth } from "@/context/AuthContext";
import { useSavePreferences } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { saveItem } from "@/utils/storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const allPreferences = [
  "Cinema",
  "Concert",
  "Art",
  "Music",
  "Brunches",
  "Sport",
  "Scientific",
  "Business",
  "Tech",
  "Realstate",
  "Automotive",
  "Fashion",
  "Outdoor",
  "Education",
  "Design",
  "Nightlife",
  "Zoo",
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [visiblePrefs] = useState(allPreferences);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const { mutate: onUpdatePreference, isPending } = useSavePreferences({
    onSuccess: async () => {
      const updatedUser = { ...user, hasPreferences: true };
      setUser(updatedUser);

      await saveItem("user", JSON.stringify(updatedUser));

      showGlobalSuccess("Preferences saved!");
      router.replace("/");
    },
    onError: (err: any) => {
      showGlobalError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save preferences"
      );
    },
  });

  const handleSelect = (item: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  const savePreference = () => {
    if (selectedPrefs.length === 0) {
      showGlobalError("Please select at least one preference");
      return;
    }

    onUpdatePreference(selectedPrefs);
  };

  return (
    <View style={tw`flex-1 bg-[#01082E] px-5 py-10`}>
      <ScrollView contentContainerStyle={tw`flex-col items-center gap-5`}>
        <View style={tw`w-full max-w-3xl gap-8 pt-10`}>
          <Text style={tw`text-white text-4xl font-semibold`}>
            Select your interest
          </Text>

          <Text style={tw`text-white text-base`}>
            This will help us choose interesting events and content for you that
            you will definitely like.
          </Text>

          {/* Preferences */}
          <View style={tw`flex-row flex-wrap justify-between mt-4`}>
            {visiblePrefs.map((item) => {
              const selected = selectedPrefs.includes(item);

              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => handleSelect(item)}
                  style={tw.style(
                    `rounded-full px-5 py-3 mb-3`,
                    selected ? `bg-[#0FF1CF]` : `bg-white`
                  )}
                >
                  <Text
                    style={tw.style(
                      `text-sm font-medium`,
                      selected ? `text-black` : `text-black`
                    )}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <CustomButton
          onPress={savePreference}
          title={isPending ? "Saving..." : "Next"}
          disabled={isPending}
          buttonClassName="bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-black"
          arrowCircleColor="bg-[#0A7F7F]"
        />
      </ScrollView>
    </View>
  );
}
