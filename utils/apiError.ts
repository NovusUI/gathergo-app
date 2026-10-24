import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = isAxiosError<{ message: string | string[] }>(error)
    ? error.response?.data.message
    : undefined;
  return Array.isArray(message) ? message.join("\n") : (message ?? fallback);
}
