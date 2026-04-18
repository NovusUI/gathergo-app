export type User = {
  id: string;
  email: string;
  hasPreferences: boolean;
  isVerified?: boolean;
  isProfileComplete?: boolean;
  name?: string;
  bio?: string;
  profilePicUrl?: string;
  username?: string;
  phoneNumber?: string;
  phoneVerifiedAt?: string;
  authProvider?: "email" | "google" | "phone";
  // add anything else you expect from backend (e.g. avatar, role, phone)
};

export type Registration = "ticket" | "registration" | "donation";

export type EventData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  location: string | null;
  isPhysicalEvent: boolean;
  links: string[];
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  endRepeat: string | null;
  reoccurring: "NONE" | "DAILY" | "WEEKLY"; // based on possible recurrence values
  communityId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  registrationType: Registration;
  registrationAttendees: number | null;
  registrationFee: number | null;
  community: null | {
    // Add community fields if available
  };
  creator: {
    id: string;
    username: string;
    profilePicUrlTN: string;
  };
  reason: string;
  isImageProcessing: boolean;
  donationTarget: number;
  lowestTicketPrice?: number | null;
  impactTitle?: string | null;
  impactDescription?: string | null;
  impactPercentage?: number | null;
  isFollowingCreator: boolean;
  isFollowedByCreator: boolean;
  totalDonations: number;
};

type DashboardEvent = {
  id: string;
  title: string;
  description: string;
  progress: number;
  participants: number;
  raised: number;
  goal: number;
  date: string;
  type: "upcoming" | "past";
};
export type AuthData = {
  accessToken: string;
  user: User;
  refreshToken: string;
};

export type EmailVerificationStateData = {
  email: string;
  requiresVerification: boolean;
};

export type PasswordResetStateData = {
  email: string;
  requiresPasswordReset: boolean;
};
enum gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export interface StandardResponse {
  status: string;
  status_code: number;
  message: string;
  data: any;
}

export interface authResponse extends StandardResponse {
  data: AuthData;
}

export interface signUpResponse extends StandardResponse {
  data: AuthData | EmailVerificationStateData;
}

export interface verifyEmailResponse extends StandardResponse {
  data: AuthData;
}

export interface resendEmailVerificationResponse extends StandardResponse {
  data: EmailVerificationStateData;
}

export interface forgotPasswordResponse extends StandardResponse {
  data: PasswordResetStateData;
}

export interface resetPasswordResponse extends StandardResponse {
  data: Record<string, never>;
}

export interface VerifyEmailCodePayload {
  email: string;
  code: string;
}

export interface ResendEmailVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface PhoneVerificationArtifact {
  sessionId?: string;
  idToken?: string;
  verificationId?: string;
  smsCode?: string;
  provider?: "firebase_pnv";
}

export interface PhoneFirebaseAuthPayload {
  phoneNumber: string;
  verificationArtifact: PhoneVerificationArtifact;
  deviceInfo?: {
    platform?: string;
    osVersion?: string;
    appVersion?: string;
    deviceName?: string;
  };
}

export interface publicProfileData extends User {
  bio: string;
  followingCount: number;
  followersCount: number;
  isFollowing: boolean;
  eventsCount: number;
}

export interface publicProfileRes extends StandardResponse {
  data: publicProfileData;
}

export interface EventsResponse extends StandardResponse {
  data: EventData[];
}

export interface DashboardEventResponse extends StandardResponse {
  data: DashboardEvent[];
}
export interface checkUsernameRes extends StandardResponse {
  data: {
    available: boolean;
  };
}

export interface checkUserData {
  username: string;
}

export interface CompleteProfileData {
  username: string;
  fullName: string;
  nationality: string;
  gender: gender;
  birthDate: string;
}

export interface uploadProfilePictureRes extends StandardResponse {
  data: {
    url: string;
    thumbnailUrl: string;
  };
}
