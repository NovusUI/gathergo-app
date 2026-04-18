import { StandardResponse } from "./auth";

export interface ScanData {
  type: "ticket" | "registration" | "donation";
  id: string;
  eventId: string;
  eventName: string;
  eventDate?: string;
  userName: string;
  userEmail?: string;
  status: string;
  isUsed: boolean;
  transactionId?: string;
  permissions?: {
    canMarkUsed: boolean;
    canViewDetails: boolean;
  };
  scannedAt?: string;
  scanLocation?: string;
  scannedBy?: string;
}

export interface ScanResponse extends StandardResponse {
  data: {
    success: boolean;
    message: string;
    data?: ScanData;
    error?: string;
  };
}

export interface ValidationResponse extends StandardResponse {
  data: {
    isValid: boolean;
    canMarkUsed: boolean;
    message: string;
    data?: ScanData;
  };
}

export interface QuickScanResponse extends StandardResponse {
  data: {
    isValid: boolean;
    canMarkUsed: boolean;
    message: string;
    type?: "ticket" | "registration";
    eventName?: string;
    userName?: string;
    eventDate?: string;
  };
}

export interface BulkScanResponse extends StandardResponse {
  data: Array<{
    qrCode: string;
    success: boolean;
    message: string;
    data?: ScanData;
    error?: string;
  }>;
}

export interface ScanHistoryItem {
  id: string;
  type: string;
  qrCode: string;
  eventName: string;
  eventDate: string;
  action: string;
  success: boolean;
  message: string;
  scannedAt: string;
  metadata?: any;
}

export interface ScanHistoryResponse extends StandardResponse {
  data: ScanHistoryItem[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ScannerStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  ticketsMarkedUsed: number;
  registrationsMarkedUsed: number;
  successRate: number;
  recentScans: Array<{
    type: string;
    action: string;
    success: boolean;
    message: string;
    scannedAt: string;
    eventName?: string;
  }>;
}

export interface ScannerStatsResponse extends StandardResponse {
  data: ScannerStats;
}

export interface ScannerPermission {
  id: string;
  scannerId: string;
  scannerName: string;
  scannerEmail: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface ScannerPermissionResponse extends StandardResponse {
  data: ScannerPermission[];
}

export interface UserSearchResult {
  id: string;
  email: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  profilePicUrlTN: string;
  createdAt: string;
}

export interface SearchUsersResponse extends StandardResponse {
  data: UserSearchResult[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface GrantPermissionPayload {
  scannerId?: string;
  userEmail?: string;
  expiresAt?: string;
}

export interface UpdatePermissionPayload {
  isActive?: boolean;
  expiresAt?: string;
}

export interface PermissionPayload {
  permissionId: string;
}
