// src/api/client.ts

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_BASE_URL, REFRESH_TOKEN_URL } from "@/constants/network";
import { useAuthStore } from "../store/auth";

const client = axios.create({
  baseURL: API_BASE_URL,
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

  if (config.data instanceof FormData) {
    console.log("tasketeeeeeeees");
    // Remove Content-Type header to let React Native set it automatically
    // with the correct boundary
    delete config.headers["Content-Type"];

    // OR set it properly for FormData
    //config.headers["Content-Type"] = "multipart/form-data";
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
        if (!refreshToken) {
          // For unauthenticated flows (login/signup/phone auth), bubble the original 401.
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(
          REFRESH_TOKEN_URL,
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
