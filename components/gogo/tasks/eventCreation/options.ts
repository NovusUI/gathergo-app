export const EVENT_CREATION_OPTIONS = [
  { type: "foodbank", title: "Food bank", hint: "Share meals in your community", icon: "restaurant-outline" },
  {
    type: "donation",
    title: "Fundraiser",
    hint: "Raise support for a cause",
    icon: "heart-outline",
  },
  {
    type: "ticket",
    title: "Ticket",
    hint: "Offer tickets to your event",
    icon: "ticket-outline",
  },
  {
    type: "registration",
    title: "Registration",
    hint: "Free or paid entry",
    icon: "clipboard-outline",
  },
  {
    type: "volunteer",
    title: "Volunteer and donation",
    hint: "Bring people together, with optional donations",
    icon: "hand-left-outline",
  },
] as const;
