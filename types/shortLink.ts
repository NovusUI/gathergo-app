import type { StandardResponse } from "./auth";

export type ShortLinkKind = "event" | "foodbank" | "carpool";
export type ShortLinkTarget = { kind: ShortLinkKind; targetId: string };
export type ShortLink = ShortLinkTarget & { code: string; createdAt: string };
export interface ShortLinkResponse extends StandardResponse {
  data: ShortLink;
}
