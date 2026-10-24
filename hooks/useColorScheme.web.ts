import { useAppTheme } from "./useAppTheme";

export function useColorScheme() {
  return useAppTheme().mode;
}
