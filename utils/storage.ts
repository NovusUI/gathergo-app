// utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const getNativeStorageKey = (key: string) =>
  key.replace(/[^A-Za-z0-9._-]/g, "_");

export async function saveItem(key: string, value: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(getNativeStorageKey(key), value);
  }
}

export async function getItem(key: string) {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(getNativeStorageKey(key));
  }
}

export async function removeItem(key: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(getNativeStorageKey(key));
  }
}
