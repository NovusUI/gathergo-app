// src/store/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setToken: (token: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  login: (token: string, refresh_token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setToken: (token) => {
        set({
          token,
          isAuthenticated: !!token,
        });
      },
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },

      login: async (token, refresh_token) => {
        await AsyncStorage.setItem("access_token", token);
        await AsyncStorage.setItem("refresh_token", refresh_token);

        set({
          token,
          refreshToken: refresh_token,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);

        set({
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
