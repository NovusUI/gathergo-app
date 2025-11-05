// context/AuthContext.tsx
import { useAuthStore } from "@/store/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types/auth";
import { getItem, saveItem } from "../utils/storage";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await getItem("user");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      saveItem("user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
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
