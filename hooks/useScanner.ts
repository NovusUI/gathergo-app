import {
  useGrantScannerPermission,
  useQuickScan,
  useRevokeScannerPermission,
  useScan,
  useUpdateScannerPermission,
} from "@/services/mutations";
import {
  useCanScan,
  useGetSearchResult,
  useGrantedScannerPermissions,
  useMyScannerPermissions,
  useScanHistory,
  useScannerStats,
} from "@/services/queries";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export const useScanner = () => {
  // Queries
  const scannerStatsQuery = useScannerStats();
  const scanHistoryQuery = useScanHistory();
  const myPermissionsQuery = useMyScannerPermissions();
  const scanQuery = useScan();

  // Mutations
  const quickScanMutation = useQuickScan();

  // Combined loading state
  const isLoading =
    scannerStatsQuery.isPending ||
    scanHistoryQuery.isPending ||
    myPermissionsQuery.isPending ||
    //quickScanMutation.isPending ||
    scanQuery.isPending;

  // Action methods
  const quickScan = useCallback(
    async (qrCode: string) => {
      try {
        const result = await quickScanMutation.mutateAsync(qrCode);
        return result.data;
      } catch (error: any) {
        const message = error.response?.data?.message || "Scan failed";
        Alert.alert("Scan Error", message);
        throw error;
      }
    },
    [quickScanMutation]
  );

  const scan = useCallback(
    async (
      qrCode: string,
      markAsUsed: boolean = false,
      location?: string,
      notes?: string
    ) => {
      try {
        const result = await scanQuery.mutateAsync({
          qrCode,
          markAsUsed,
          location,
          notes,
        });

        // Refetch data after successful scan
        if (result.data?.success) {
          scannerStatsQuery.refetch();
          scanHistoryQuery.refetch();
        }

        return result.data;
      } catch (error: any) {
        const message = error.response?.data?.message || "Scan failed";
        //Alert.alert("Scan Error", message);
        throw error;
      }
    },
    [scanQuery, scannerStatsQuery, scanHistoryQuery]
  );

  return {
    // Data from queries
    stats: scannerStatsQuery.data?.data,
    history: scanHistoryQuery.data?.pages?.flatMap((page) => page.data) || [],
    permissions: myPermissionsQuery.data?.data || [],

    // Loading states
    isLoading: {
      stats: scannerStatsQuery.isLoading,
      history: scanHistoryQuery.isLoading,
      permissions: myPermissionsQuery.isLoading,
      quickScan: quickScanMutation.isPending,
      scan: scanQuery.isPending,
      all: isLoading,
    },

    // Errors
    error: {
      stats: scannerStatsQuery.error,
      history: scanHistoryQuery.error,
      permissions: myPermissionsQuery.error,
      quickScan: quickScanMutation.error,
      scan: scanQuery.error,
    },

    // Actions
    quickScan,
    scan,

    // Refetch methods
    refetchStats: scannerStatsQuery.refetch,
    refetchHistory: scanHistoryQuery.refetch,
    refetchPermissions: myPermissionsQuery.refetch,
    fetchMoreHistory: scanHistoryQuery.fetchNextPage,

    // Pagination info
    pagination: {
      hasMoreHistory: scanHistoryQuery.hasNextPage,
      isFetchingMoreHistory: scanHistoryQuery.isFetchingNextPage,
    },
  };
};

export const useScannerPermissions = (eventId?: string) => {
  const [searchParams, setSearchParams] = useState<{
    query: string;
    field: "email" | "username" | "fullName";
  } | null>(null);

  // Queries
  const grantedPermissionsQuery = useGrantedScannerPermissions();
  const searchUsersQuery = useGetSearchResult(
    searchParams?.query || "",
    "users",
    10,
    {
      enabled: !!searchParams?.query,
    }
  );

  const canScanQuery = useCanScan(eventId!, { enabled: !!eventId });

  // Mutations
  const grantPermissionMutation = useGrantScannerPermission();
  const updatePermissionMutation = useUpdateScannerPermission(); // Will be set dynamically
  const revokePermissionMutation = useRevokeScannerPermission(); // Will be set dynamically

  // Action methods
  const grantPermission = useCallback(
    async (payload: {
      scannerId?: string;
      userEmail?: string;
      expiresAt?: string;
    }) => {
      try {
        const result = await grantPermissionMutation.mutateAsync(payload);

        // Refetch permissions after granting
        if (result) {
          grantedPermissionsQuery.refetch();
        }

        return result.data;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to grant permission";
        Alert.alert("Permission Error", message);
        throw error;
      }
    },
    [grantPermissionMutation, grantedPermissionsQuery, eventId]
  );

  const updatePermission = useCallback(
    async (
      permissionId: string,
      payload: { isActive?: boolean; expiresAt?: string }
    ) => {
      try {
        const result = await updatePermissionMutation.mutateAsync({
          permissionId,
          ...payload,
        });

        // Refetch permissions after update
        grantedPermissionsQuery.refetch();

        return result.data;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to update permission";
        //Alert.alert("Permission Error", message);
        throw error;
      }
    },
    [updatePermissionMutation, grantedPermissionsQuery]
  );

  const revokePermission = useCallback(
    async (permissionId: string) => {
      try {
        const result = await revokePermissionMutation.mutateAsync({
          permissionId,
        });

        // Refetch permissions after revoking
        grantedPermissionsQuery.refetch();

        return result.data;
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to revoke permission";
        Alert.alert("Permission Error", message);
        throw error;
      }
    },
    [revokePermissionMutation, grantedPermissionsQuery]
  );

  const canMarkAsUsed = useCallback(() => {
    return canScanQuery.data?.canMarkAsUsed || false;
  }, [canScanQuery.data]);

  // const searchUsers = useCallback(
  //   async (query: { email?: string; username?: string; fullName?: string }) => {
  //     try {
  //       searchUsersQuery.refetch();
  //       return searchUsersQuery.data?.pages?.flatMap((page) => page.data) || [];
  //     } catch (error: any) {
  //       Alert.alert("Search Error", "Failed to search users");
  //       return [];
  //     }
  //   },
  //   [searchUsersQuery]
  // );

  const searchUsers = useCallback(
    async (query: { email?: string; username?: string; fullName?: string }) => {
      console.log(query, "this is query");
      try {
        // Determine which field to search by
        const searchField = query.email
          ? "email"
          : query.username
          ? "username"
          : "fullName";

        const searchTerm =
          query.email || query.username || query.fullName || "";

        console.log(searchTerm);
        if (!searchTerm) {
          // Clear search if empty
          setSearchParams(null);
          return [];
        }

        // Update search parameters - this will trigger the query
        setSearchParams({
          query: searchTerm,
          field: searchField,
        });

        // Wait for the query to complete
        // Since we can't directly await a query, we return the data
        // The data will be available on next render or you can use the isLoading state
        return [];
      } catch (error: any) {
        Alert.alert("Search Error", "Failed to search users");
        return [];
      }
    },
    [] // No dependencies needed
  );
  return {
    // Data
    grantedPermissions: grantedPermissionsQuery.data?.data || [],
    searchResults:
      searchUsersQuery.data?.pages?.flatMap((page) => page.data) || [],
    canScan: canScanQuery.data,

    // Loading states
    isLoading: {
      grantedPermissions: grantedPermissionsQuery.isLoading,
      search: searchUsersQuery.isLoading,
      canScan: canScanQuery.isLoading,
      grantPermission: grantPermissionMutation.isPending,
      updatePermission: updatePermissionMutation.isPending,
      revokePermission: revokePermissionMutation.isPending,
    },

    // Errors
    errors: {
      grantedPermissions: grantedPermissionsQuery.error,
      search: searchUsersQuery.error,
      canScan: canScanQuery.error,
      grantPermission: grantPermissionMutation.error,
      updatePermission: updatePermissionMutation.error,
      revokePermission: revokePermissionMutation.error,
    },

    // Actions
    grantPermission,
    updatePermission,
    revokePermission,

    canMarkAsUsed,
    searchUsers,

    // Refetch methods
    refetchGrantedPermissions: grantedPermissionsQuery.refetch,
    refetchSearch: searchUsersQuery.refetch,
    fetchMoreUsers: searchUsersQuery.fetchNextPage,

    // Pagination info
    pagination: {
      hasMoreUsers: searchUsersQuery.hasNextPage,
      isFetchingMoreUsers: searchUsersQuery.isFetchingNextPage,
    },
  };
};
