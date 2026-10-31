import type {
  InterestProfile,
  EventFeedbackResult,
  SaveEventFeedback,
  SaveInterestProfile,
  PreferenceResponse,
} from '@/types/preferences';
import { useAuth } from "@/context/AuthContext";
import type { SaveVolunteerRole, VolunteerAction, VolunteerApplication, VolunteerResponse, VolunteerRole } from "@/types/volunteer";
import { showGlobalError } from "@/utils/globalErrorHandler";
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
  EventImpactReport,
  EventTicketResponse,
  GetTicketsResponse,
  InitiateDonationPayload,
  RegistrationCheckoutPayload,
  TicketCheckoutPayload,
  UpsertEventImpactReportPayload,
} from "@/types/event";
import {
  ConfirmWalletPayoutProfileResponse,
  NotifyOnKycResolutionPayload,
  NotifyOnKycResolutionResponse,
  ResolveWalletPayoutAccountPayload,
  StartBusinessKycPayload,
  StartBusinessRepresentativeKycPayload,
  StartPersonalKycPayload,
  SubmitWalletKycPayload,
  SubmitWalletLivenessPayload,
  UpsertWalletPayoutProfilePayload,
  WalletKycResponse,
  WalletPayoutAccountResolutionResponse,
  WalletPayoutProfileResponse,
} from "@/types/wallet";
import { saveItem } from "@/utils/storage";
import {
  type QueryClient,
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError, isAxiosError } from "axios";
import { QUERY_KEYS } from "./queryKeys";
import {
  updateBadgeVisibility,
  resetInterestLearning,
  deleteInterestMap,
  performVolunteerAction, saveVolunteerRole,
  SignUpPayload,
  bulkScanFn,
  canScanFn,
  checkUsernameExists,
  completUserProfile,
  confirmWalletPayoutProfileFn,
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
  resolveWalletPayoutAccountFn,
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
  publishEventTicket,
  updatePreference,
  saveEventFeedback,
  deferEventFeedback,
  updateScannerPermissionFn,
  upsertEventImpactReport,
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
  QuickScanResponse,
} from "@/types/scanner";


export const useResolveWalletPayoutAccount = (options?: any) => {
  return useMutation<
    WalletPayoutAccountResolutionResponse,
    AxiosError,
    ResolveWalletPayoutAccountPayload
  >({
    mutationFn: resolveWalletPayoutAccountFn,
    ...options,
  });
};

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

export const useConfirmWalletPayoutProfile = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation<ConfirmWalletPayoutProfileResponse, AxiosError, void>({
    mutationFn: confirmWalletPayoutProfileFn,
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

  return useMutation<WalletKycResponse, AxiosError, SubmitWalletKycPayload | void>({
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
      setUser(data.data.user);

      await saveItem("token", data.data.accessToken);
      await saveItem("user", JSON.stringify(data.data.user));
      //queryClient.setQueryData(QUERY_KEYS.currentUser, data.user);
    },
  });
};

function useInterestMapMutation<TVariables>(
  mutationFn: (
    variables: TVariables,
  ) => Promise<PreferenceResponse<InterestProfile>>,
  options?: UseMutationOptions<
    PreferenceResponse<InterestProfile>,
    AxiosError,
    TVariables
  >,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    ...options,
    mutationFn,
    onSuccess: async (...args) => {
      queryClient.setQueryData(
        [...QUERY_KEYS.interestProfile, user?.id],
        args[0],
      );
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.foryouEvents],
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
      await options?.onSuccess?.(...args);
    },
  });
}
export const useSavePreferences = (
  options?: UseMutationOptions<
    PreferenceResponse<InterestProfile>,
    AxiosError,
    SaveInterestProfile
  >,
) => useInterestMapMutation(updatePreference, options);
export const useResetInterestLearning = (
  options?: UseMutationOptions<
    PreferenceResponse<InterestProfile>,
    AxiosError,
    void
  >,
) => useInterestMapMutation(resetInterestLearning, options);
export const useDeleteInterestMap = (
  options?: UseMutationOptions<
    PreferenceResponse<InterestProfile>,
    AxiosError,
    void
  >,
) => useInterestMapMutation(deleteInterestMap, options);

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
  const { logout } = useAuth();
  return useMutation({
    mutationFn: logoutFn,
    onSettled: logout,
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
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: createEvent,
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletOnboarding });
      return options.onSuccess?.(...args);
    },
  });

  return { mutate, mutateAsync, isPending, error };
};

function invalidateEventParticipationQueries(
  queryClient: QueryClient,
  eventId: string,
) {
  return Promise.all(
    [
      [QUERY_KEYS.volunteerRoles, eventId],
      [QUERY_KEYS.volunteerRoster, eventId],
      [QUERY_KEYS.volunteerSummary, eventId],
      [QUERY_KEYS.eventDetails, eventId],
      QUERY_KEYS.volunteerHistory,
      [QUERY_KEYS.getEventDashboard, eventId],
      [QUERY_KEYS.getDashboard],
      [QUERY_KEYS.getDashboardEvents],
      [QUERY_KEYS.foryouEvents],
      [QUERY_KEYS.getUserEvents],
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

function useVolunteerMutation<TData, TVariables>(
  eventId: string,
  mutationFn: (variables: TVariables) => Promise<VolunteerResponse<TData>>,
  options?: UseMutationOptions<
    VolunteerResponse<TData>,
    AxiosError,
    TVariables
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn,
    onSuccess: async (...args) => {
      await invalidateEventParticipationQueries(queryClient, eventId);
      await options?.onSuccess?.(...args);
    },
    onError: (...args) => {
      const error = args[0];
      const message = isAxiosError<{ message: string | string[] }>(error)
        ? error.response?.data.message
        : undefined;
      showGlobalError(
        typeof message === "string"
          ? message
          : Array.isArray(message)
            ? message.join("\n")
            : error.message,
      );
      options?.onError?.(...args);
    },
  });
}

export const useVolunteerAction = (
  eventId: string,
  options?: UseMutationOptions<
    VolunteerResponse<VolunteerApplication>,
    AxiosError,
    VolunteerAction
  >,
) =>
  useVolunteerMutation(
    eventId,
    (action: VolunteerAction) => performVolunteerAction(eventId, action),
    options,
  );

export const useSaveVolunteerRole = (
  eventId: string,
  options?: UseMutationOptions<
    VolunteerResponse<VolunteerRole>,
    AxiosError,
    SaveVolunteerRole
  >,
) =>
  useVolunteerMutation(
    eventId,
    (change: SaveVolunteerRole) => saveVolunteerRole(eventId, change),
    options,
  );

export const useUpdateEvent = (
  eventId: string,
  options: UseMutationOptions<StandardResponse, Error, FormData>,
) => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    ...options,
    mutationFn: (formData: FormData) => updateEvent(formData, eventId),
    onSuccess: async (...args) => {
      await invalidateEventParticipationQueries(queryClient, eventId);
      await options.onSuccess?.(...args);
    },
  });

  return { mutate, mutateAsync, isPending, error };
};

export const usePublishEventTicket = (
  eventId: string,
  options?: UseMutationOptions<EventTicketResponse, AxiosError, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: publishEventTicket,
    onSuccess: async (...args) => {
      await invalidateEventParticipationQueries(queryClient, eventId);
      await options?.onSuccess?.(...args);
    },
  });
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
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: registerForEvent,
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myRegistrations }),
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.eventDetails, args[1].eventId],
        }),
      ]);
      await options.onSuccess?.(...args);
    },
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useUpsertEventImpactReport = (
  eventId: string,
  options?: UseMutationOptions<
    EventImpactReport,
    AxiosError,
    UpsertEventImpactReportPayload
  >
) => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (payload: UpsertEventImpactReportPayload) =>
      upsertEventImpactReport(eventId, payload),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.eventDetails, eventId],
      });
      options?.onSuccess?.(...args);
    },
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
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: createCarpool,
    ...options,
    onSuccess: async (...args) => {
      await invalidateCarpoolListQueries(queryClient);
      await options.onSuccess?.(...args);
    },
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
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (requestRes: "ACCEPTED" | "DECLINED") =>
      respondToCarpoolRequest(requestRes, requestId),
    ...options,
    onSuccess: async (...args) => {
      await invalidateCarpoolListQueries(queryClient);
      await options.onSuccess?.(...args);
    },
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useRemovePassenger = (
  requestId: string,
  options: UseMutationOptions<StandardResponse, AxiosError>
) => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => removePassenger(requestId),
    ...options,
    onSuccess: async (...args) => {
      await invalidateCarpoolListQueries(queryClient);
      await options.onSuccess?.(...args);
    },
  });

  return { mutate, mutateAsync, isPending, error };
};

export const useLeaveCarpool = (
  carpoolId: string,
  options: UseMutationOptions<StandardResponse, AxiosError>
) => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => leaveCarpool(carpoolId),
    ...options,
    onSuccess: async (...args) => {
      await invalidateCarpoolListQueries(queryClient);
      await options.onSuccess?.(...args);
    },
  });

  return { mutate, mutateAsync, isPending, error };
};

function invalidateCarpoolListQueries(queryClient: QueryClient) {
  return Promise.all(
    [QUERY_KEYS.carpoolForYou, QUERY_KEYS.eventCarpoolsPaginated].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );
}

function invalidateCarpoolFollowQueries(queryClient: QueryClient) {
  return Promise.all([
    invalidateCarpoolListQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.carpoolDetails] }),
  ]);
}

export const useFollowUser = (
  options: UseMutationOptions<
    StandardResponse,
    AxiosError,
    { followingId: string }
  >
) => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: followUser,
    ...options,
    onSuccess: async (...args) => {
      await invalidateCarpoolFollowQueries(queryClient);
      await options.onSuccess?.(...args);
    },
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useUnfollowUser = (
  userId: string,
  options: UseMutationOptions<StandardResponse, AxiosError>
) => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => unfollowUser(userId),
    ...options,
    onSuccess: async (...args) => {
      await invalidateCarpoolFollowQueries(queryClient);
      await options.onSuccess?.(...args);
    },
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
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (requestData: {
      cancelCarpoolId: string;
      origin: string;
      note?: string;
      startPoint?: { lng: number; lat: number };
    }) => requestCarpoolAfterCancel(requestData, carpoolId),
    ...options,
    onSuccess: async (...args) => {
      await invalidateCarpoolListQueries(queryClient);
      await options.onSuccess?.(...args);
    },
  });
  return { mutate, mutateAsync, isPending, error };
};

// Scanner mutations
export const useQuickScan = (
  options?: UseMutationOptions<QuickScanResponse, AxiosError, string>
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

export const useBadgeVisibility = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBadgeVisibility,
    onSuccess: async (response) => {
      queryClient.setQueryData([...QUERY_KEYS.badges, user?.id], response);
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.userPublicProfile, user?.id],
      });
    },
  });
};

export const useSaveEventFeedback = () => {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation<PreferenceResponse<EventFeedbackResult>, AxiosError, SaveEventFeedback>({
    mutationFn: saveEventFeedback,
    onSuccess: async (response) => {
      client.setQueryData([...QUERY_KEYS.interestProfile, user?.id], { ...response, data: response.data.profile });
      await client.invalidateQueries({ queryKey: [...QUERY_KEYS.pendingEventFeedback, user?.id], refetchType: "none" });
      await client.invalidateQueries({ queryKey: [QUERY_KEYS.foryouEvents] });
    },
  });
};
export const useDeferEventFeedback = () => {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: deferEventFeedback,
    onSuccess: (response) => {
      client.setQueryData([...QUERY_KEYS.pendingEventFeedback, user?.id], { ...response, data: null });
    },
  });
};
