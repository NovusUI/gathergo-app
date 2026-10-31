// src/api/uploadClient.ts
import { API_BASE_URL } from "@/constants/network";
import { assertCurrentSession, refreshSession } from "@/services/refreshSession";
import { useAuthStore } from "../store/auth";

const BASE_URL = API_BASE_URL;

interface UploadOptions {
  method?: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  timeout?: number;
  onProgress?: (progress: number) => void;
}

export class UploadClient {
  private static instance: UploadClient;

  static getInstance(): UploadClient {
    if (!UploadClient.instance) {
      UploadClient.instance = new UploadClient();
    }
    return UploadClient.instance;
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
    const { token, sessionVersion } = useAuthStore.getState();

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

      assertCurrentSession(sessionVersion);
      if (response.status === 401 && !isRetry) {
        await refreshSession(sessionVersion);
        assertCurrentSession(sessionVersion);
        return this.upload(url, formData, options, true);
      }

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        assertCurrentSession(sessionVersion);
        throw this.createError(errorData, response.status);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        assertCurrentSession(sessionVersion);
        return result;
      }

      const result = await response.text();
      assertCurrentSession(sessionVersion);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort errors differently
      //   if (error instanceof DOMException && error.name === "AbortError") {
      //     throw new Error("Request timeout");
      //   }

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
