import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppearanceStore } from "@/store/appearance";
import type { ThemeMode } from "@/constants/theme";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const OPTIONS = [
  { mode: "light", title: "Light", icon: "sunny-outline" },
  { mode: "dark", title: "Dark", icon: "moon-outline" },
] as const;

export default function AppearancePreference() {
  const { mode, tw, colors } = useAppTheme();
  const setMode = useAppearanceStore((state) => state.setMode);
  const [saving, setSaving] = useState(false);
  const choose = async (nextMode: ThemeMode) => {
    if (saving || nextMode === mode) return;
    setSaving(true);
    try {
      await setMode(nextMode);
    } catch {
      showGlobalError("Unable to save appearance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={tw`mb-4 rounded-2xl border border-border bg-surface p-4 gap-3`}>
      <View>
        <Text accessibilityRole="header" style={tw`text-base font-semibold text-foreground`}>
          Appearance
        </Text>
        <Text style={tw`mt-1 text-sm text-muted`}>Make GatherGo feel like you.</Text>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel="Appearance" style={tw`flex-row gap-3`}>
        {OPTIONS.map((option) => {
          const selected = mode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              accessibilityRole="radio"
              accessibilityLabel={`${option.title} mode`}
              aria-checked={selected}
              accessibilityState={{ checked: selected, disabled: saving }}
              disabled={saving}
              onPress={() => void choose(option.mode)}
              style={tw.style(
                "flex-1 min-h-14 flex-row items-center justify-center gap-2 rounded-xl border px-3 py-3",
                selected ? "bg-accentFill border-accentFill" : "bg-background border-border",
              )}
            >
              <Ionicons name={option.icon} size={19} color={selected ? colors.onAccent : colors.muted} />
              <Text style={tw.style("font-semibold", selected ? "text-onAccent" : "text-foreground")}>
                {option.title}
              </Text>
              {selected ? <Ionicons name="checkmark-circle" size={17} color={colors.onAccent} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
