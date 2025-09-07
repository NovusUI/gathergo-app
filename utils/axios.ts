/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, } from "axios";
import { getAuthToken, isAuthenticated } from "../services/Auth";

export const baseUrl = "https://api.pillometer.com/api/v1";

// Primary API instance
const Api: AxiosInstance = axios.create({
  baseURL: baseUrl,
});

// Request Interceptor
const requestInterceptor = (instance: AxiosInstance, useApiKey = false) => {
  instance.interceptors.request.use(
    async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
      config.headers = {
        ...config.headers,
        Authorization: useApiKey
          ? `Token ${import.meta.env.VITE_INFERENCE_API_KEY}`
          : isAuthenticated()
          ? `Token ${getAuthToken()}`
          : "",
      };
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Response Interceptor
const responseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      // Right now we don’t have a refresh token flow
      // so just reject the error for now
      return Promise.reject(error);
    }
  );
};

// Attach interceptors
requestInterceptor(Api);
responseInterceptor(Api);

export { Api };
