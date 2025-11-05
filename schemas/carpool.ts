import { z } from "zod";

export const carpoolSchema = z
  .object({
    isToEvent: z.boolean(),
    poolLocation: z.string().optional(),
    useCurrentLocation: z.boolean(),
    poolDestination: z.string().optional(),
    departureTime: z.string().min(1, "Departure time is required"),
    notes: z
      .string()
      .max(200, "Notes must not exceed 200 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isToEvent && !data.poolLocation) {
      ctx.addIssue({
        path: ["poolLocation"],
        code: "custom",
        message: "Pool location is required when going to event.",
      });
    }

    if (!data.isToEvent && !data.poolDestination) {
      ctx.addIssue({
        path: ["poolDestination"],
        code: "custom",
        message: "Pool destination is required when returning from event.",
      });
    }
  });

export type CarpoolFormValues = z.infer<typeof carpoolSchema>;
