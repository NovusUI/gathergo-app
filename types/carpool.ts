export type CarpoolForm = {
  origin: string;
  destination?: string;
  departureTime: string; // ISO string
  note?: string;
  description?: string;
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
