import { z } from "zod";

export const bioSchema = z.object({
  bio: z.string().max(300, "Bio must not exceed 300 characters").min(1,"say something"),
});

export type BioFormValues = z.infer<typeof bioSchema>;
