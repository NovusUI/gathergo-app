import type { User } from "@/types/auth";
import { jwtDecode } from "jwt-decode";

export function authSessionUserId(token: string | null): User["id"] | null {
  return token ? jwtDecode<{ sub: User["id"] }>(token).sub : null;
}
