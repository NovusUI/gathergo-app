export interface HomeAdCard {
  id: string;
  key: string;
  variant: "image" | "copy";
  eyebrow?: string | null;
  title: string;
  body: string;
  cta: string;
  route?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  eventId?: string | null;
  icon?: string | null;
  accentColor?: string | null;
}

export interface HomeAdCardsResponse {
  status: string;
  message: string;
  data: HomeAdCard[];
}
