// src/store/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  login: (token: string, refresh_token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setToken: (token) => {
        set({
          token,
          isAuthenticated: !!token,
        });
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
    }
  )
);
