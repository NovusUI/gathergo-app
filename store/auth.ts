// src/store/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clearSessionQueryCache } from "@/services/sessionQueryCache";
import { removeItem } from "@/utils/storage";

export type GoogleAuthPhase = "idle" | "opening" | "completing";
let pendingLogout: Promise<void> = Promise.resolve();

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  googleAuthPhase: GoogleAuthPhase;
  sessionVersion: number;
  setGoogleAuthPhase: (phase: GoogleAuthPhase) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  login: (token: string, refresh_token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      googleAuthPhase: "idle",
      sessionVersion: 0,
      setGoogleAuthPhase: (googleAuthPhase) => set({ googleAuthPhase }),

      setToken: (token) => {
        if (token === null) {
          void get().logout().catch((error) => console.error("Session cleanup failed", error));
          return;
        }
        set({
          token,
          isAuthenticated: !!token,
        });
      },
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },

      login: async (token, refresh_token) => {
        await pendingLogout;
        const clearingCache = clearSessionQueryCache();
        if (get().isAuthenticated) {
          set({ token: null, refreshToken: null, isAuthenticated: false, sessionVersion: get().sessionVersion + 1 });
        }
        await clearingCache;
        await AsyncStorage.setItem("access_token", token);
        await AsyncStorage.setItem("refresh_token", refresh_token);

        set({
          token,
          refreshToken: refresh_token,
          isAuthenticated: true,
          sessionVersion: get().sessionVersion + 1,
        });
      },

      logout: () => {
        const clearingCache = clearSessionQueryCache();
        set({
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          googleAuthPhase: "idle",
          sessionVersion: get().sessionVersion + 1,
        });
        const cleanup = Promise.all([
          clearingCache,
          AsyncStorage.multiRemove(["access_token", "refresh_token"]),
          removeItem("token"),
          removeItem("user"),
        ]).then(() => {});
        pendingLogout = cleanup.catch(() => {});
        return cleanup;
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
