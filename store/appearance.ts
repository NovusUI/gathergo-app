import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "@/constants/theme";
import { create } from "zustand";

export const APPEARANCE_KEY = "gathergo_appearance";
interface AppearanceState {
  mode: ThemeMode;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}
export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  mode: "dark",
  hasHydrated: false,
  hydrate: async () => {
    if (get().hasHydrated) return;
    try {
      const stored = await AsyncStorage.getItem(APPEARANCE_KEY);
      if (stored === "light" || stored === "dark") set({ mode: stored });
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
