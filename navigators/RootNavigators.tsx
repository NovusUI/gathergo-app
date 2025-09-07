import { useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // splash screen can go here

  useEffect(()=>{
    console.log(user)
  },[user])

  return (
  
      <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(app)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>

  );
}
