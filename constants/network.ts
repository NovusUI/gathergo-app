const DEFAULT_API_BASE_URL = "http://192.168.0.101:4000/api/v1";

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
  DEFAULT_API_BASE_URL //configuredApiBaseUrl || DEFAULT_API_BASE_URL
);

export const SOCKET_URL = toSocketOrigin(
  DEFAULT_API_BASE_URL //configuredSocketUrl || configuredApiBaseUrl || DEFAULT_API_BASE_URL
);

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/auth/google`;
export const REFRESH_TOKEN_URL = `${API_BASE_URL}/auth/refresh`;
