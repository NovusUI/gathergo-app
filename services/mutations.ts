import { useAuth } from "@/context/AuthContext";
import {
  CompleteProfileData,
  ForgotPasswordPayload,
  PhoneFirebaseAuthPayload,
  forgotPasswordResponse,
  ResendEmailVerificationPayload,
  ResetPasswordPayload,
  resetPasswordResponse,
  StandardResponse,
  authResponse,
  checkUsernameRes,
  resendEmailVerificationResponse,
  signUpResponse,
  uploadProfilePictureRes,
  VerifyEmailCodePayload,
  verifyEmailResponse,
} from "@/types/auth";
import { CarpoolForm } from "@/types/carpool";
import {
  DonationResponse,
  GetTicketsResponse,
  InitiateDonationPayload,
  RegistrationCheckoutPayload,
  TicketCheckoutPayload,
} from "@/types/event";
import {
  NotifyOnKycResolutionPayload,
  NotifyOnKycResolutionResponse,
  StartBusinessKycPayload,
  StartBusinessRepresentativeKycPayload,
  StartPersonalKycPayload,
  SubmitWalletLivenessPayload,
  UpsertWalletPayoutProfilePayload,
  WalletKycResponse,
  WalletPayoutProfileResponse,
} from "@/types/wallet";
import { saveItem } from "@/utils/storage";
import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { QUERY_KEYS } from "./queryKeys";
import {
  SignUpPayload,
  bulkScanFn,
  canScanFn,
  checkUsernameExists,
  completUserProfile,
  createCarpool,
  createEvent,
  edtUserBio,
  followUser,
  forgotPasswordFn,
  getTickets,
  googleLoginFn,
  grantScannerPermissionFn,
  initiateDonation,
  leaveCarpool,
  loginFn,
  notifyOnKycResolutionFn,
  logoutFn,
  quickScanFn,
  registerForEvent,
  startBusinessKycFn,
  startBusinessRepresentativeKycFn,
  startPersonalKycFn,
  submitWalletKycFn,
  submitWalletLivenessFn,
  upsertWalletPayoutProfileFn,
  registerPushToken,
  removePassenger,
  removePushToken,
  requestCarpool,
  requestCarpoolAfterCancel,
  resetPasswordFn,
  respondToCarpoolRequest,
  resendEmailVerificationCodeFn,
  revokeScannerPermissionFn,
  scanFn,
  phoneFirebaseAuthFn,
  signUpFn,
  unfollowUser,
  updateCarpool,
  updateEvent,
  updatePreference,
  updateScannerPermissionFn,
  uploadPicture,
  validateScanFn,
  verifyEmailCodeFn,
} from "./serviceFn";

import {
  BulkScanResponse,
  GrantPermissionPayload,
  PermissionPayload,
  ScanResponse,
  ScannerPermissionResponse,
  UpdatePermissionPayload,
  ValidationResponse,
} from "@/types/scanner";


export const useUpsertWalletPayoutProfile = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<WalletPayoutProfileResponse, AxiosError, UpsertWalletPayoutProfilePayload>({
    mutationFn: upsertWalletPayoutProfileFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletKyc });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useStartPersonalKyc = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<WalletKycResponse, AxiosError, StartPersonalKycPayload>({
    mutationFn: startPersonalKycFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletKyc });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useSubmitWalletLiveness = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<WalletKycResponse, AxiosError, SubmitWalletLivenessPayload>({
    mutationFn: submitWalletLivenessFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletKyc });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useStartBusinessKyc = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<WalletKycResponse, AxiosError, StartBusinessKycPayload>({
    mutationFn: startBusinessKycFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletKyc });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useStartBusinessRepresentativeKyc = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<WalletKycResponse, AxiosError, StartBusinessRepresentativeKycPayload>({
    mutationFn: startBusinessRepresentativeKycFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletKyc });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useSubmitWalletKyc = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<WalletKycResponse, AxiosError, void>({
    mutationFn: submitWalletKycFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletKyc });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useNotifyOnKycResolution = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<
    NotifyOnKycResolutionResponse,
    AxiosError,
    NotifyOnKycResolutionPayload
  >({
    mutationFn: notifyOnKycResolutionFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletKyc });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  const { setUser } = useAuth();
  return useMutation({
    mutationFn: loginFn,
    onSuccess: async (data) => {
      // ✅ set current user cache after login
      console.log(data, "data");
      setUser(data.data.user);

      await saveItem("token", data.data.accessToken);
      await saveItem("user", JSON.stringify(data.data.user));
      //queryClient.setQueryData(QUERY_KEYS.currentUser, data.user);
    },
  });
};

export const useSavePreferences = (
  options: UseMutationOptions<StandardResponse, AxiosError, string[]>
) => {
  return useMutation({
    mutationFn: updatePreference,
    ...options,
  });
};

export const useSignUpMutation = () => {
  return useMutation<signUpResponse, Error, SignUpPayload>({
    mutationFn: signUpFn,
    onSuccess: (data) => {
      console.log(data, "data");
    },
    onError: (error) => {
      console.log(error);
    },
  });
};

export const useVerifyEmailCode = () => {
  return useMutation<verifyEmailResponse, AxiosError, VerifyEmailCodePayload>({
    mutationFn: verifyEmailCodeFn,
  });
};

export const useResendEmailVerificationCode = () => {
  return useMutation<
    resendEmailVerificationResponse,
    AxiosError,
    ResendEmailVerificationPayload
  >({
    mutationFn: resendEmailVerificationCodeFn,
  });
};

export const useForgotPassword = () => {
  return useMutation<forgotPasswordResponse, AxiosError, ForgotPasswordPayload>({
    mutationFn: forgotPasswordFn,
  });
};

export const useResetPassword = () => {
  return useMutation<resetPasswordResponse, AxiosError, ResetPasswordPayload>({
    mutationFn: resetPasswordFn,
  });
};

export const useGoogleLogin = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation<authResponse, any, string>({
    mutationFn: googleLoginFn,
    onSuccess: async (data) => {
      setUser(data.data.user);

      await saveItem("token", data.data.accessToken);
      await saveItem("user", JSON.stringify(data.data.user));
      //queryClient.setQueryData(QUERY_KEYS.currentUser, data.user);
    },
  });
};

export const usePhoneFirebaseAuth = () => {
  const { setUser } = useAuth();

  return useMutation<authResponse, any, PhoneFirebaseAuthPayload>({
    mutationFn: phoneFirebaseAuthFn,
    onSuccess: async (data) => {
      setUser(data.data.user);

      await saveItem("token", data.data.accessToken);
      await saveItem("user", JSON.stringify(data.data.user));
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.currentUser });
    },
  });
};

export const useCheckUsernameExists = (
  options: UseMutationOptions<checkUsernameRes, AxiosError, string>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: checkUsernameExists,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useCompleteProfile = (
  options: UseMutationOptions<StandardResponse, AxiosError, CompleteProfileData>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: completUserProfile,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useEditBio = (
  options: UseMutationOptions<StandardResponse, AxiosError, { bio: string }>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: edtUserBio,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

// export const useEditProfilePicture = (
//   options: UseMutationOptions<uploadProfilePictureRes, AxiosError, FormData>
// ) => {
//   const { mutate, mutateAsync, isPending, error } = useMutation({
//     mutationFn: uploadPicture,
//     ...options,
//   });

//   return { mutate, mutateAsync, isPending, error };
// };

export const useEditProfilePicture = (
  options: UseMutationOptions<uploadProfilePictureRes, Error, FormData>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: uploadPicture,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

// export const useCreateEvent = (
//   options: UseMutationOptions<StandardResponse, AxiosError, FormData>
// ) => {
//   const { mutate, mutateAsync, isPending, error } = useMutation({
//     mutationFn: createEvent,
//     ...options,
//   });

//   return { mutate, mutateAsync, isPending, error };
// };

export const useCreateEvent = (
  options: UseMutationOptions<StandardResponse, Error, FormData>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: createEvent,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

// export const useUpdateEvent = (
//   eventId: string,
//   options: UseMutationOptions<StandardResponse, AxiosError, FormData>
// ) => {
//   const { mutate, mutateAsync, isPending, error } = useMutation({
//     mutationFn: (formData: FormData) => updateEvent(formData, eventId),
//     ...options,
//   });

//   return { mutate, mutateAsync, isPending, error };
// };

export const useUpdateEvent = (
  eventId: string,
  options: UseMutationOptions<StandardResponse, Error, FormData> // Changed AxiosError to Error
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (formData: FormData) => updateEvent(formData, eventId),
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useGetTickets = (
  options: UseMutationOptions<GetTicketsResponse, AxiosError, TicketCheckoutPayload>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: getTickets,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useRegisterEvent = (
  options: UseMutationOptions<GetTicketsResponse, AxiosError, RegistrationCheckoutPayload>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: registerForEvent,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useInitiateDonation = (
  options?: UseMutationOptions<
    DonationResponse,
    AxiosError,
    InitiateDonationPayload
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: initiateDonation,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useCreateCarpool = (
  options: UseMutationOptions<StandardResponse, AxiosError, CarpoolForm>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: createCarpool,
    ...options,
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useUpdateCarpool = (
  carpoolId: string,
  options: UseMutationOptions<StandardResponse, AxiosError, any>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (carpoolData: any) => updateCarpool(carpoolData, carpoolId),
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useRequestCarpool = (
  carpoolId: string,
  options: UseMutationOptions<StandardResponse, AxiosError, any>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (requestData: any) => requestCarpool(requestData, carpoolId),
    ...options,
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useCarpoolRequestRes = (
  requestId: string,
  options: UseMutationOptions<
    StandardResponse,
    AxiosError,
    "ACCEPTED" | "DECLINED"
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (requestRes: "ACCEPTED" | "DECLINED") =>
      respondToCarpoolRequest(requestRes, requestId),
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useRemovePassenger = (
  requestId: string,
  options: UseMutationOptions<StandardResponse, AxiosError>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => removePassenger(requestId),
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useLeaveCarpool = (
  carpoolId: string,
  options: UseMutationOptions<StandardResponse, AxiosError>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => leaveCarpool(carpoolId),
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useFollowUser = (
  options: UseMutationOptions<
    StandardResponse,
    AxiosError,
    { followingId: string }
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: followUser,
    ...options,
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useUnfollowUser = (
  userId: string,
  options: UseMutationOptions<StandardResponse, AxiosError>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => unfollowUser(userId),
    ...options,
  });
  return { mutate, mutateAsync, isPending, error };
};

// mutations.ts - Add these mutations
export const useRegisterPushToken = (
  options?: UseMutationOptions<
    StandardResponse,
    AxiosError,
    { token: string; platform: string }
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: registerPushToken,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useRemovePushToken = (
  options?: UseMutationOptions<StandardResponse, AxiosError, { token: string }>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: removePushToken,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useRequestCarpoolAfterCancel = (
  carpoolId: string,
  options: UseMutationOptions<
    StandardResponse,
    AxiosError,
    {
      cancelCarpoolId: string;
      origin: string;
      note?: string;
      startPoint?: { lng: number; lat: number };
    }
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (requestData: {
      cancelCarpoolId: string;
      origin: string;
      note?: string;
      startPoint?: { lng: number; lat: number };
    }) => requestCarpoolAfterCancel(requestData, carpoolId),
    ...options,
  });
  return { mutate, mutateAsync, isPending, error };
};

// Scanner mutations
export const useQuickScan = (
  options?: UseMutationOptions<ValidationResponse, AxiosError, string>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: quickScanFn,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useScan = (
  options?: UseMutationOptions<
    ScanResponse,
    AxiosError,
    {
      qrCode: string;
      markAsUsed?: boolean;
      location?: string;
      notes?: string;
    }
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: scanFn,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useBulkScan = (
  options?: UseMutationOptions<
    BulkScanResponse,
    AxiosError,
    {
      scans: Array<{ qrCode: string; markAsUsed?: boolean }>;
    }
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: bulkScanFn,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useValidateScan = (
  options?: UseMutationOptions<ValidationResponse, AxiosError, string>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: validateScanFn,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

// Scanner permission mutations
export const useGrantScannerPermission = (
  options?: UseMutationOptions<
    ScannerPermissionResponse,
    AxiosError,
    GrantPermissionPayload
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: grantScannerPermissionFn,
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useUpdateScannerPermission = (
  options?: UseMutationOptions<
    ScannerPermissionResponse,
    AxiosError,
    UpdatePermissionPayload & { permissionId: string }
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (
      payload: UpdatePermissionPayload & { permissionId: string }
    ) => {
      const { permissionId, ...rest } = payload;
      return updateScannerPermissionFn(permissionId, rest);
    },
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useRevokeScannerPermission = (
  options?: UseMutationOptions<StandardResponse, AxiosError, PermissionPayload>
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (payload: PermissionPayload) =>
      revokeScannerPermissionFn(payload.permissionId),
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useCanScan = (
  eventId: string,
  options?: UseMutationOptions<
    { canScan: boolean; canMarkAsUsed: boolean },
    AxiosError
  >
) => {
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => canScanFn(eventId),
    ...options,
  });

  return { mutate, mutateAsync, isPending, error };
};
