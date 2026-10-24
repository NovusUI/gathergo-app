import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const WELCOME_KEY = "gathergo_welcome_seen";

interface OnboardingState {
  hasSeenWelcome: boolean;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  completeWelcome: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasSeenWelcome: false,
  hasHydrated: false,
  hydrate: async () => {
    if (get().hasHydrated) return;
    try {
      const value = await AsyncStorage.getItem(WELCOME_KEY);
      set({ hasSeenWelcome: value === "seen" });
    } catch (error) {
      console.error("Failed to restore the GatherGo welcome preference", error);
    } finally {
      set({ hasHydrated: true });
    }
  },
  completeWelcome: () => {
    set({ hasSeenWelcome: true });
    AsyncStorage.setItem(WELCOME_KEY, "seen").catch((error) =>
      console.error("Failed to save the GatherGo welcome preference", error),
    );
  },
}));
