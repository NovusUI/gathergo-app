const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureApiVersion(value: string): string {
  const normalized = trimTrailingSlash(value);
  if (normalized.endsWith("/api/v1")) {
    return normalized;
  }

  return `${normalized}/api/v1`;
}

function toSocketOrigin(value: string): string {
  return trimTrailingSlash(value).replace(/\/api\/v1$/, "");
}

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const configuredSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();

export const API_BASE_URL = ensureApiVersion(
  configuredApiBaseUrl || DEFAULT_API_BASE_URL
);

export const SOCKET_URL = toSocketOrigin(
  configuredSocketUrl || configuredApiBaseUrl || DEFAULT_API_BASE_URL
);

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/auth/google`;
export const REFRESH_TOKEN_URL = `${API_BASE_URL}/auth/refresh`;
