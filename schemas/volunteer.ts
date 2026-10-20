import { z } from "zod";

export const volunteerRoleSchema = z.object({
  title: z.string().trim().min(1, "Add a role title").max(100),
  description: z
    .string()
    .trim()
    .min(1, "Describe what volunteers will do")
    .max(1000),
  capacity: z
    .number()
    .int("Use a whole number of places")
    .min(1, "Add at least one place")
    .max(100000),
  requiresApproval: z.boolean(),
});
