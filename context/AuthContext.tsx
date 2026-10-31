// context/AuthContext.tsx
import { useAuthStore } from "@/store/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types/auth";
import { getItem, saveItem } from "../utils/storage";
import { authSessionUserId } from "@/utils/authSession";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated, hasHydrated, sessionVersion } = useAuthStore();
  const userId = authSessionUserId(isAuthenticated ? token : null);
  const hasCurrentUser = user?.id === userId;

  useEffect(() => {
    if (!hasHydrated) return;
    let active = true;
    if (userId === null) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (hasCurrentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const storedUser = await getItem("user");
        if (active && storedUser) {
          const profile: User = JSON.parse(storedUser);
          setUser((current) => current?.id === userId ? current : profile.id === userId ? profile : null);
        }
      } catch (error) {
        console.error("Could not restore the signed-in profile", error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [hasHydrated, userId, hasCurrentUser]);

  useEffect(() => {
    if (user && user.id === userId) {
      void saveItem("user", JSON.stringify(user));
    }
  }, [user, userId]);

  const logout = async () => {
    const session = useAuthStore.getState();
    if (session.sessionVersion === sessionVersion) await session.logout();
  };

  return (
    <AuthContext.Provider value={{ user: user?.id === userId ? user : null, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
