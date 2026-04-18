export type CarpoolForm = {
  origin: string;
  destination?: string;
  departureTime: string; // ISO string
  note?: string;
  description?: string;
  vehicleIcon?: string;
  availableSeats?: number;
  pricePerSeat?: number;
  startPoint?: {
    lat: number;
    lng: number;
  };
  endPoint?: {
    lat: number;
    lng: number;
  };
  eventId?: string;
};

export type EventCarpoolFilter = "all" | "close_to_you" | "followed";

export interface PaginatedEventCarpoolQuery {
  eventId: string;
  filter?: EventCarpoolFilter;
  latitude?: number;
  longitude?: number;
  pageSize?: number;
}

export interface EventCarpoolListItem {
  id: string;
  origin: string;
  destination: string | null;
  departureTime: string;
  availableSeats: number;
  seatsLeft: number;
  pricePerSeat: number;
  description: string | null;
  vehicleIcon: string | null;
  note: string | null;
  status: string;
  expiresAt: string;
  distanceKm: number | null;
  isCloseToYou: boolean;
  isFollowedOwner: boolean;
  ranking: {
    priority: number;
    primaryReason: "distance" | "followed_owner" | "others";
    reasons: string[];
  };
  driver: {
    id: string;
    username: string;
    profilePicUrlTN: string | null;
    isVerified: boolean;
  };
  event: {
    id: string;
    title: string;
    imageUrl: string | null;
  };
}

export interface PaginatedEventCarpoolsResponse {
  status: string;
  message: string;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
  };
  data: EventCarpoolListItem[];
}
