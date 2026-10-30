import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "@/constants/theme";
import { create } from "zustand";

export const APPEARANCE_KEY = "gathergo_appearance";
export type AppearanceSetting = ThemeMode | "system";
interface AppearanceState {
  mode: AppearanceSetting;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: AppearanceSetting) => Promise<void>;
}
export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  mode: "system",
  hasHydrated: false,
  hydrate: async () => {
    if (get().hasHydrated) return;
    try {
      const stored = await AsyncStorage.getItem(APPEARANCE_KEY);
      if (stored === "system" || stored === "light" || stored === "dark") set({ mode: stored });
      else if (stored !== null) console.error("Invalid saved GatherGo appearance:", stored);
    } catch (error) {
      console.error("Failed to restore GatherGo appearance", error);
    } finally {
      set({ hasHydrated: true });
    }
  },
  setMode: async (mode) => {
    await AsyncStorage.setItem(APPEARANCE_KEY, mode);
    set({ mode });
  },
}));
