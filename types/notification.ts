export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  imageUrl?: string;
  link?: string;
  createdAt: string;
  read: boolean;
  recipientId: string;
}
