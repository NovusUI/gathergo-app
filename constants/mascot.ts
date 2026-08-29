export type GatherGoMascotVariant =
  | "idle"
  | "donation"
  | "success"
  | "pending"
  | "verified"
  | "empty"
  | "error";

export type MascotMomentCopy = {
  variant: GatherGoMascotVariant;
  title: string;
  message: string;
};

export const TRANSACTION_MASCOT_MOMENTS = {
  DONATION_SUCCESS: {
    variant: "donation",
    title: "A note from GatherGo",
    message:
      "Thank you for showing up. Your donation just helped this event move forward."
  },
  TICKET_SUCCESS: {
    variant: "success",
    title: "Your pass is ready",
    message:
      "You are in. Keep your pass close and jump into the event buzz when you are ready."
  },
  REGISTRATION_SUCCESS: {
    variant: "success",
    title: "Registration saved",
    message:
      "You are registered. I saved the next steps here so you can head in smoothly."
  },
  TRANSFER_PENDING: {
    variant: "pending",
    title: "I am watching this",
    message:
      "I am checking for your bank transfer. This page will update once it lands."
  },
  PROCESSING: {
    variant: "pending",
    title: "Checking payment",
    message:
      "I am checking this payment now. Hang tight while the confirmation comes through."
  },
  FAILED: {
    variant: "error",
    title: "Not confirmed yet",
    message:
      "I could not confirm this payment yet. You can try again or check back in a moment."
  }
} as const satisfies Record<string, MascotMomentCopy>;
