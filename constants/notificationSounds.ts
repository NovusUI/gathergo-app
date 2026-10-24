export const NOTIFICATION_SOUNDS = {
  general: {
    channelId: "gogo_general_v1",
    name: "General notifications and messages",
    sound: "gogo_general.wav",
  },
  carpoolPositive: {
    channelId: "gogo_carpool_positive_v1",
    name: "Carpool requests and acceptances",
    sound: "gogo_carpool_positive.wav",
  },
  carpoolRejection: {
    channelId: "gogo_carpool_rejection_v1",
    name: "Carpool rejections",
    sound: "gogo_carpool_rejection.wav",
  },
  celebration: {
    channelId: "gogo_celebration_v1",
    name: "Frenzy and milestones",
    sound: "gogo_celebration.wav",
  },
} as const;
