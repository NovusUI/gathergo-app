export type GatherGoMascotVariant =
  | "idle"
  | "donation"
  | "success"
  | "pending"
  | "verified"
  | "empty"
  | "error";

export const GOGO_PALETTE = {
  body: "#1EEBC8",
  limbs: "#0FB898",
  face: "#0B3B35",
  coral: "#FF5C7A",
  yellow: "#FFD84D",
  blush: "#FF8F7E",
} as const;

export type GogoPose = "base" | "wave" | "celebrate" | "lost";

export const GOGO_POSES: Record<GatherGoMascotVariant, GogoPose> = {
  idle: "wave",
  donation: "celebrate",
  success: "celebrate",
  pending: "base",
  verified: "celebrate",
  empty: "lost",
  error: "base",
};

export type MascotMomentCopy = {
  variant: GatherGoMascotVariant;
  title: string;
  message: string;
};

export const getProfileWelcomeCopy = (
  birthDate: Date | null,
  today = new Date(),
): MascotMomentCopy => {
  let age: number | null = null;
  if (birthDate) {
    const birthdayStillAhead =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate());
    age =
      today.getFullYear() -
      birthDate.getFullYear() -
      Number(birthdayStillAhead);
  }

  const message =
    age !== null && age < 18
      ? "Okay, you're in! New experiences, new people, and a whole lot to discover. Bring your curiosity. I'll bring the little nudges."
      : age === null || age < 30
        ? "Your people. Your plans. Your next 'you had to be there' moment. Let's find an event that feels like you."
        : age < 50
          ? "Good company, fresh experiences, and plans worth making time for. Let's give your calendar something to smile about."
          : "Good company never gets old, and neither does finding a new favourite experience. Shall we make a few lovely memories?";

  return { variant: "success", title: "Meet Gogo", message };
};

export const TRANSACTION_MASCOT_MOMENTS = {
  DONATION_SUCCESS: {
    variant: "donation",
    title: "A note from Gogo",
    message:
      "Thank you for showing up. Your donation just helped this event move forward.",
  },
  TICKET_SUCCESS: {
    variant: "success",
    title: "Your pass is ready",
    message:
      "You are in. Keep your pass close and jump into the event buzz when you are ready.",
  },
  REGISTRATION_SUCCESS: {
    variant: "success",
    title: "Registration saved",
    message:
      "You are registered. I saved the next steps here so you can head in smoothly.",
  },
  TRANSFER_PENDING: {
    variant: "pending",
    title: "I am watching this",
    message:
      "I am checking for your bank transfer. This page will update once it lands.",
  },
  PROCESSING: {
    variant: "pending",
    title: "Checking payment",
    message:
      "I am checking this payment now. Hang tight while the confirmation comes through.",
  },
  FAILED: {
    variant: "error",
    title: "Not confirmed yet",
    message:
      "I could not confirm this payment yet. You can try again or check back in a moment.",
  },
} as const satisfies Record<string, MascotMomentCopy>;
