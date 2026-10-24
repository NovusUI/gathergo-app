import type { User } from "@/types/auth";

export function authenticatedStartRoute(
  user: Pick<User, "isProfileComplete" | "hasPreferences"> | null,
) {
  if (!user?.isProfileComplete) return "/profile-setup";
  if (!user.hasPreferences) return "/preference";
  return "/";
}
