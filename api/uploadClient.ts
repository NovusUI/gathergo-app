// src/api/uploadClient.ts
import { useAuthStore } from "../store/auth";

const BASE_URL = "http://172.25.243.53:4000/api/v1";

interface UploadOptions {
  method?: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  timeout?: number;
  onProgress?: (progress: number) => void;
}

// Same refresh logic as axios client
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
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

export class UploadClient {
  private static instance: UploadClient;

  static getInstance(): UploadClient {
    if (!UploadClient.instance) {
      UploadClient.instance = new UploadClient();
    }
    return UploadClient.instance;
  }

  private async refreshToken(): Promise<string> {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    const newAccessToken = data.data.accessToken;

    // Update token in store
    const { setToken } = useAuthStore.getState();
    setToken(newAccessToken);

    return newAccessToken;
  }

  async upload(
    url: string,
    formData: FormData,
    options: UploadOptions = {},
    isRetry = false
  ): Promise<any> {
    const {
      method = "POST",
      headers = {},
      timeout = 60000,
      onProgress,
    } = options;

    // Get auth token
    const { token, refreshToken, logout } = useAuthStore.getState();

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    try {
      const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

      // Prepare headers
      const requestHeaders: Record<string, string> = {
        ...headers,
      };

      // Add auth header if token exists
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }

      // Note: DON'T set Content-Type for FormData with fetch in React Native
      delete requestHeaders["Content-Type"];

      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: formData,
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - Token expired
      if (response.status === 401 && !isRetry) {
        clearTimeout(timeoutId);

        // If we're already refreshing, add to queue
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (newToken) {
                requestHeaders["Authorization"] = `Bearer ${newToken}`;
              }
              return this.upload(url, formData, options, true);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;

        try {
          const newAccessToken = await this.refreshToken();
          processQueue(null, newAccessToken);

          // Retry with new token
          return this.upload(url, formData, options, true);
        } catch (refreshError) {
          processQueue(refreshError, null);

          // Refresh failed, logout
          logout();
          throw new Error("Session expired. Please login again.");
        } finally {
          isRefreshing = false;
        }
      }

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw this.createError(errorData, response.status);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort errors differently
      //   if (error instanceof DOMException && error.name === "AbortError") {
      //     throw new Error("Request timeout");
      //   }

      console.log(error);

      throw this.handleNetworkError(error);
    }
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  }

  private createError(data: any, status: number): Error {
    const error = new Error(
      data?.message || `Upload failed with status ${status}`
    );
    (error as any).status = status;
    (error as any).data = data;
    return error;
  }

  private handleNetworkError(error: any): Error {
    if (error.message?.includes("Network request failed")) {
      return new Error("Network error. Please check your connection.");
    }
    return error;
  }

  // Helper method for image uploads
  async uploadImage(
    url: string,
    imageUri: string,
    fieldName: string = "file",
    fileName?: string,
    mimeType: string = "image/jpeg"
  ): Promise<any> {
    const formData = new FormData();

    // Extract file name from URI if not provided
    let finalFileName = fileName;
    if (!finalFileName) {
      const uriParts = imageUri.split("/");
      finalFileName = uriParts[uriParts.length - 1] || "upload.jpg";
    }

    // Ensure proper file extension
    if (!finalFileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
      finalFileName = `${finalFileName}.jpg`;
    }

    formData.append(fieldName, {
      uri: imageUri,
      name: finalFileName,
      type: mimeType,
    } as any);

    return this.upload(url, formData);
  }
}

export const uploadClient = UploadClient.getInstance();
