import type { InfiniteData } from "@tanstack/react-query";

export interface Sender {
  id: string;
  username: string | null;
}

export interface Message {
  id: string;
  tempId: string | null;
  content: string;
  carpoolId: string;
  senderId: string;
  createdAt: string;
  sender: Sender;
  readBy: { id: string }[];
  optimistic?: boolean;
  error?: string | null;
}

export interface PageCursor {
  before: string | null;
  beforeId: string | null;
}

export type MessagesInfiniteData = InfiniteData<Message[], PageCursor>;
export type SendMessagePayload = Pick<Message, "carpoolId" | "content"> & {
  tempId: string;
};
export type SendMessageResult =
  | { ok: true; message: Message }
  | { ok: false; error: string; retryable: boolean };
