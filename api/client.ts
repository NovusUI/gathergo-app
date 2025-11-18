// src/api/client.ts

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth";

const client = axios.create({
  baseURL: "http://10.42.21.150:4000/api/v1", // adjust
  timeout: 100000,
});

// Flag to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor → attach token
client.interceptors.request.use(async (config) => {
  //const token = await getItem("access_token");
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor → handle 401 with refresh logic
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        //onst refreshToken = await getItem("refresh_token");
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) throw new Error("No refresh token");

        const refreshResponse = await axios.post(
          "http://10.42.21.150:4000/api/v1/auth/refresh",
          { refreshToken }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;

        //await saveItem("access_token", newAccessToken);

        const { setToken } = useAuthStore.getState();
        setToken(newAccessToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        console.log(newAccessToken, "new token access");

        console.log(refreshToken, "refreshing");
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // await removeItem("access_token");
        // await removeItem("refresh_token");
        const { logout } = useAuthStore.getState();
        logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
