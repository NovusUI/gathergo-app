
export type User = {
    id:string,
    email:string,
    hasPreferences: boolean,
    isVerified:boolean,
    isProfileComplete:boolean,
    name: string,
    bio:string,
    profilePicUrl:string
    // add anything else you expect from backend (e.g. avatar, role, phone)
};

export type Registration = "ticket" | "registration";


export type EventData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  location: string;
  links: string[];
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  endRepeat: string | null;
  reoccurring: "NONE" | "DAILY" | "WEEKLY"  // based on possible recurrence values
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
};



type AuthData = {
    accessToken:string;
    user: User
}
enum gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

  export interface StandardResponse {
    status: string
    status_code: number
    message: string
    data:any

  }

  export interface authResponse extends StandardResponse {
    data: AuthData
  }

  export interface publicProfileData extends User {
     bio: string,
     followingCount: number,
     followersCount: number,
     isFollowing: boolean,
     eventsCount: number
  }

  export interface publicProfileRes extends StandardResponse{
    data:publicProfileData
  }




  export interface EventsResponse extends StandardResponse{
    data: EventData[]
  }

  export interface checkUsernameRes extends StandardResponse {
    data: {
        available:boolean
    }
  }

  export interface checkUserData {
    username:string
  }

  export interface CompleteProfileData {
    username: string,
    fullName: string,
    nationality: string,
    gender: gender,
    birthDate: string,
  }

  export interface uploadProfilePictureRes extends StandardResponse {
    data :{
      url:string;
      thumbnailUrl:string;
    }
  }