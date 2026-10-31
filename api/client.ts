import { assertCurrentSession, refreshSession } from "@/services/refreshSession";
import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";

declare module "axios" {
  interface AxiosRequestConfig {
    _authSessionVersion?: number;
    _retry?: boolean;
  }
}

const client = axios.create({
  baseURL: "http://192.168.0.101:4000/api/v1",
  timeout: 100000,
});

client.interceptors.request.use((config) => {
  if (config._retry) assertCurrentSession(config._authSessionVersion);
  const { token, sessionVersion } = useAuthStore.getState();
  config._authSessionVersion = sessionVersion;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers["Content-Type"];
  return config;
}, (error) => { throw error; }, { synchronous: true });

client.interceptors.response.use(
  (response) => {
    assertCurrentSession(response.config._authSessionVersion);
    return response;
  },
  async (error: AxiosError) => {
    const request = error.config;
    if (!request) return Promise.reject(error);
    const sessionVersion = request._authSessionVersion;
    assertCurrentSession(sessionVersion);
    if (error.response?.status === 401 && !request._retry && useAuthStore.getState().refreshToken) {
      request._retry = true;
      const token = await refreshSession(sessionVersion);
      assertCurrentSession(sessionVersion);
      request.headers.Authorization = `Bearer ${token}`;
      return client(request);
    }
    return Promise.reject(error);
  },
);

export default client;
