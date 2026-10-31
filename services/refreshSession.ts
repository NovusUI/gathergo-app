import { REFRESH_TOKEN_URL } from "@/constants/network";
import { useAuthStore } from "@/store/auth";
import type { AuthData, authResponse } from "@/types/auth";
import axios, { CanceledError } from "axios";

export function assertCurrentSession(sessionVersion: number | undefined): asserts sessionVersion is number {
  if (sessionVersion !== useAuthStore.getState().sessionVersion) {
    throw new CanceledError("The account changed while this request was running.");
  }
}

let pending: { sessionVersion: number; promise: Promise<string> } | null = null;

export function refreshSession(sessionVersion: number): Promise<string> {
  assertCurrentSession(sessionVersion);
  if (pending?.sessionVersion === sessionVersion) return pending.promise;
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return Promise.reject(new Error("No refresh token available"));

  const promise = axios.post<Omit<authResponse, "data"> & { data: Pick<AuthData, "accessToken"> }>(
    REFRESH_TOKEN_URL, { refreshToken },
  ).then(({ data }) => {
    assertCurrentSession(sessionVersion);
    const token = data.data.accessToken;
    useAuthStore.getState().setToken(token);
    return token;
  }).catch(async (error) => {
    if (useAuthStore.getState().sessionVersion === sessionVersion) {
      await useAuthStore.getState().logout();
    }
    throw error;
  }).finally(() => {
    if (pending?.promise === promise) pending = null;
  });
  pending = { sessionVersion, promise };
  return promise;
}
