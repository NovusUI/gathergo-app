import CustomButton from "@/components/buttons/CustomBtn1";
import { useAuth } from "@/context/AuthContext";
import { useSavePreferences } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { saveItem } from "@/utils/storage";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useRef, useState } from "react";
import { Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const INTEREST_GRAPH: Record<string, string[]> = {
  Cinema: ["Film Festivals", "Pop Culture", "Nightlife", "Photography"],
  Concert: ["Music", "Nightlife", "Festival", "Dance"],
  Art: ["Design", "Photography", "Museum", "Crafts"],
  Music: ["Concert", "Dance", "Nightlife", "Festival"],
  Brunches: ["Food", "Lifestyle", "Wellness", "Networking"],
  Sport: ["Fitness", "Outdoor", "Health", "Adventure"],
  Scientific: ["STEM", "Innovation", "Education", "Tech"],
  Business: ["Startup", "Networking", "Finance", "Leadership"],
  Tech: ["Innovation", "AI", "Gaming", "STEM"],
  Realstate: ["Business", "Finance", "Architecture", "Design"],
  Automotive: ["Motorsport", "Adventure", "Tech", "Outdoor"],
  Fashion: ["Lifestyle", "Design", "Beauty", "Photography"],
  Outdoor: ["Adventure", "Travel", "Fitness", "Nature"],
  Education: ["Career", "STEM", "Leadership", "Scientific"],
  Design: ["Art", "Architecture", "Fashion", "Photography"],
  Nightlife: ["Music", "Dance", "Food", "Festival"],
  Zoo: ["Nature", "Family", "Outdoor", "Photography"],
  Food: ["Brunches", "Lifestyle", "Culture", "Travel"],
  Dance: ["Music", "Nightlife", "Fitness", "Festival"],
  Festival: ["Music", "Outdoor", "Culture", "Travel"],
  Photography: ["Art", "Design", "Fashion", "Travel"],
  Museum: ["Art", "Culture", "Education", "History"],
  Startup: ["Tech", "Business", "Networking", "Innovation"],
  Networking: ["Business", "Career", "Leadership", "Startup"],
  Finance: ["Business", "Realstate", "Career", "Leadership"],
  Wellness: ["Health", "Fitness", "Lifestyle", "Mindfulness"],
  Health: ["Wellness", "Fitness", "Scientific", "Lifestyle"],
  Fitness: ["Sport", "Outdoor", "Health", "Dance"],
  Adventure: ["Outdoor", "Travel", "Automotive", "Nature"],
  Travel: ["Outdoor", "Festival", "Food", "Culture"],
  Nature: ["Outdoor", "Zoo", "Adventure", "Photography"],
  Culture: ["Food", "Museum", "Festival", "Art"],
  Architecture: ["Design", "Realstate", "Art", "Culture"],
  Beauty: ["Fashion", "Lifestyle", "Wellness", "Design"],
  AI: ["Tech", "Innovation", "STEM", "Scientific"],
  Gaming: ["Tech", "Pop Culture", "Innovation", "Nightlife"],
  Leadership: ["Business", "Career", "Education", "Networking"],
  Career: ["Education", "Business", "Leadership", "Networking"],
  Family: ["Zoo", "Food", "Outdoor", "Culture"],
  "Pop Culture": ["Cinema", "Gaming", "Music", "Festival"],
  STEM: ["Tech", "Scientific", "Education", "AI"],
  Innovation: ["Tech", "Startup", "Scientific", "AI"],
  History: ["Museum", "Culture", "Education", "Art"],
  Crafts: ["Art", "Design", "Culture", "Lifestyle"],
  Lifestyle: ["Brunches", "Fashion", "Food", "Wellness"],
  Mindfulness: ["Wellness", "Health", "Lifestyle", "Nature"],
};

const STARTER_CLUSTERS = [
  {
    label: "Arts, Culture & Storytelling",
    items: ["Art", "Cinema", "Museum", "Photography", "Design"],
  },
  {
    label: "Community & Social Good",
    items: ["Food", "Brunches", "Culture", "Family", "Networking"],
  },
  {
    label: "Health, Wellness & Care",
    items: ["Wellness", "Health", "Fitness", "Mindfulness", "Sport"],
  },
  {
    label: "Education, Learning & Growth",
    items: ["Education", "Career", "Leadership", "Scientific", "STEM"],
  },
  {
    label: "Climate, Nature & Outdoors",
    items: ["Outdoor", "Nature", "Adventure", "Travel", "Zoo"],
  },
  {
    label: "Innovation, Work & Future Ideas",
    items: ["Tech", "AI", "Gaming", "Business", "Innovation"],
  },
];

const ALL_STARTER_ITEMS = STARTER_CLUSTERS.flatMap((c) => c.items);

function AnimatedChip({
  item,
  selected,
  onPress,
  variant = "default",
}: {
  item: string;
  selected: boolean;
  onPress: () => void;
  variant?: "default" | "suggested";
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: selected ? 1 : 1.1, useNativeDriver: true, speed: 20, bounciness: 14 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={tw.style(
          `rounded-full px-4 py-2.5 border`,
          selected
            ? `bg-[#0FF1CF] border-[#0FF1CF]`
            : variant === "suggested"
            ? `bg-[#0FF1CF]/10 border-[#0FF1CF]/40`
            : `bg-[#1B2A50] border-[#2A3D6A]`
        )}
      >
        <Text
          style={tw.style(
            `text-sm font-semibold`,
            selected
              ? `text-[#01082E]`
              : variant === "suggested"
              ? `text-[#0FF1CF]`
              : `text-white`
          )}
        >
          {item}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PreferencesScreen() {
  const router = useLockedRouter();
  const { user, setUser } = useAuth();
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
        err?.response?.data?.message || err?.message || "Failed to save preferences"
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

  const suggestionGroups: { source: string; items: string[] }[] = [];
  const addedToGroup = new Set<string>();

  selectedPrefs.forEach((sel) => {
    const items = (INTEREST_GRAPH[sel] || []).filter(
      (suggestion) =>
        !selectedPrefs.includes(suggestion) &&
        !ALL_STARTER_ITEMS.includes(suggestion) &&
        !addedToGroup.has(suggestion)
    );

    if (items.length > 0) {
      items.forEach((i) => addedToGroup.add(i));
      suggestionGroups.push({ source: sel, items });
    }
  });

  return (
    <View style={tw`flex-1 bg-[#01082E] px-5 pt-14 pb-6`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`gap-8 pb-4`}>
        <View style={tw`gap-2`}>
          <Text style={tw`text-[#0FF1CF] text-[11px] font-bold tracking-widest uppercase`}>
            Your Impact Map
          </Text>
          <Text style={tw`text-white text-3xl font-bold tracking-tight`}>
            What kind of impact calls you?
          </Text>
          <Text style={tw`text-gray-400 text-sm leading-5`}>
            Choose the causes, communities, and spaces you naturally care about. We&apos;ll use this to shape your event world.
          </Text>
        </View>

        {STARTER_CLUSTERS.map((cluster) => (
          <View key={cluster.label} style={tw`gap-3`}>
            <Text style={tw`text-gray-400 text-xs font-semibold uppercase tracking-widest`}>
              {cluster.label}
            </Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {cluster.items.map((item) => (
                <AnimatedChip
                  key={item}
                  item={item}
                  selected={selectedPrefs.includes(item)}
                  onPress={() => handleSelect(item)}
                />
              ))}
            </View>
          </View>
        ))}

        {suggestionGroups.map(({ source, items }) => (
          <View key={source} style={tw`gap-3`}>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Sparkles size={12} color="#0FF1CF" />
              <Text style={tw`text-gray-400 text-xs`}>
                This usually connects with{" "}
                <Text style={tw`text-white font-semibold`}>{source}</Text>
              </Text>
            </View>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {items.map((item) => (
                <AnimatedChip
                  key={item}
                  item={item}
                  selected={selectedPrefs.includes(item)}
                  onPress={() => handleSelect(item)}
                  variant="suggested"
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={tw`pt-4 gap-3`}>
        {selectedPrefs.length > 0 && (
          <View style={tw`flex-row items-center justify-between px-1`}>
            <Text style={tw`text-gray-400 text-sm`}>
              <Text style={tw`text-white font-bold`}>{selectedPrefs.length}</Text>{" "}
              signals shaping your GatherGo feed
            </Text>
            <TouchableOpacity onPress={() => setSelectedPrefs([])}>
              <Text style={tw`text-[#FF8A8A] text-sm`}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
        <CustomButton
          onPress={savePreference}
          title={isPending ? "Saving..." : "Build my impact feed"}
          disabled={isPending || selectedPrefs.length === 0}
          buttonClassName="bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-black"
          arrowCircleColor="bg-[#0A7F7F]"
        />
      </View>
    </View>
  );
}
