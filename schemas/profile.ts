import * as z from "zod";

// Helper: calculate minimum allowed date (13 years ago)
const MIN_AGE = 13;
const today = new Date();
const minBirthdate = new Date(
  today.getFullYear() - MIN_AGE,
  today.getMonth(),
  today.getDate()
);

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full Name must be at least 2 characters"),
  nationality: z.string().min(2, "Please select your nationality"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"],  "Please select your gender" ),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9._]*$/,
      "Username must start with a letter and can only contain letters, numbers, underscores, and periods"
    ),
  birthDate: z
  .date()
  .refine((val) => !!val, { message: "Please select your birthdate" })
  .max(minBirthdate, { message: `You must be at least ${MIN_AGE} years old` }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
