import type { Registration, StandardResponse } from "@/types/auth";
import type { ImpactSuggestionData } from "@/types/impact";

export interface ImpactSuggestionPayload {
  title?: string | null;
  description?: string | null;
  impactDescription?: string | null;
  registrationType?: Registration | null;
}

export interface ImpactSuggestionResponse extends StandardResponse {
  data: ImpactSuggestionData;
}
