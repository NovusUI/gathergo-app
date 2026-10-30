import { isValidEventLink, normalizeEventLinks } from "@/constants/eventLinks";
import { DEFAULT_REGISTRATION_CAPACITY } from "@/utils/eventForm";
import { buildEventDateTimeIso } from "@/utils/dateTimeHandler";
import type {
  SuggestedImpactCommitment,
  SuggestedImpactPath,
  SuggestedSdgGoal,
} from "@/types/impact";
import { z } from "zod";
import { volunteerRoleSchema } from "@/schemas/volunteer";
import { canRecruitVolunteers, VOLUNTEER_IMPACT_STORY_REQUIRED } from "@/utils/volunteer";

const impactSdgGoalSchema = z.custom<SuggestedSdgGoal>();
const impactPathSchema = z.custom<SuggestedImpactPath>();
const impactCommitmentSchema = z.custom<SuggestedImpactCommitment>();

export const eventTicketSchema = z
  .object({
    description: z.string().min(1, { message: "Description is required" }),

    limited: z.boolean().default(true),

    quantity: z
      .union([
        z.number().min(5, { message: "Quantity must be at least 5" }),
        z.string().transform((val) => (val === "" ? undefined : Number(val))),
      ])
      .optional(),

    paid: z.boolean().default(true),
    id: z.uuidv4({ version: "v4" }),

    isVisible: z.boolean().default(true),
    updatedPrice: z
      .union([
        z.number().min(0, { message: "Price must be 0 or more" }),
        z.string().transform((val) => (val === "" ? undefined : Number(val))),
      ])
      .optional(),
    isNew: z.boolean().default(true),
    price: z
      .union([
        z.number().min(0, { message: "Price must be 0 or more" }),
        z.string().transform((val) => (val === "" ? undefined : Number(val))),
      ])
      .optional(),

    type: z.string().min(1, { message: "Type is required" }),

    perks: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // Quantity validation
    if (data.limited && (data.quantity == null || data.quantity < 5)) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity must be at least 5 when stockType is limited",
        path: ["quantity"],
      });
    }

    // Price validation
    if (data.paid && (data.price === undefined || data.price <= 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Price must be provided",
        path: ["price"],
      });
    }

    if (data.paid && (data.price === undefined || data.price <= 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Price cannot be 0",
        path: ["price"],
      });
    }
  });

export const eventSchema = z
  .object({
    imgUrl: z.url().optional(),

    eventName: z
      .string()
      .min(1, "Event name is required")
      .max(100, "Event name must be at most 100 characters"),

    description: z
      .string()
      .trim()
      .min(1, "Describe your event")
      .max(300, "Event description must be at most 300 characters"),

    impactTitle: z
      .string()
      .max(80, "Impact focus must be at most 80 characters")
      .default(""),

    impactDescription: z
      .string()
      .trim()
      .max(180, "Impact story must be at most 180 characters")
      .default(""),

    impactPercentage: z
      .union([
        z.number().min(1).max(100),
        z.string().transform((val) => (val === "" ? undefined : Number(val))),
      ])
      .optional(),
    impactSdgGoals: z.array(impactSdgGoalSchema).optional(),
    impactPaths: z.array(impactPathSchema).optional(),
    impactCommitments: z.array(impactCommitmentSchema).optional(),
    impactMapSource: z.string().optional(),
    impactMapGeneratedAt: z.string().optional(),

    repeat: z.enum(["WEEKLY", "DAILY", "NONE"]),

    startDate: z.coerce.date({
      error: "Date and time is required",
    }),
    endDate: z.coerce.date(),
    startTime: z.string(),
    endTime: z.string(),
    endRepeat: z.coerce.date().optional(),
    isRecurring: z.boolean(),

    isPhysicalEvent: z.boolean().default(true),
    location: z.string().trim().default(""),
    links: z.preprocess(
      (value) => {
        if (!Array.isArray(value)) {
          return [];
        }

        return normalizeEventLinks(
          value.map((item) => (typeof item === "string" ? item : "")),
        );
      },
      z
        .array(
          z.string().refine(isValidEventLink, {
            message: "Each link must be a valid URL",
          }),
        )
        .max(5, "You can add up to 5 links"),
    ),

    tags: z.array(z.string()),
    registrationType: z.enum(["donation", "ticket", "registration", "volunteer", "foodbank"], {
      error: "Choose how people will participate",
    }),

    tickets: z.array(eventTicketSchema).optional(),
    registrationAttendees: z.number().optional(),
    registrationFee: z.number().optional(),
    foodBankTotalMeals: z.number().int().min(1).max(1000000).optional(),
    foodBankSlotCapacity: z.number().int().min(1).max(10000).optional(),
    foodBankSlotMinutes: z.number().int().min(5).max(120).optional(),
    donationTarget: z.number().optional(),
    donationsEnabled: z.boolean().default(false),
    volunteerRoles: z.array(volunteerRoleSchema).max(20).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.registrationType === 'foodbank') {
      for (const field of ['foodBankTotalMeals', 'foodBankSlotCapacity', 'foodBankSlotMinutes'] as const) {
        if (data[field] === undefined) ctx.addIssue({ code: 'custom', path: [field], message: 'Set your collection capacity and windows' });
      }
      if (!data.isPhysicalEvent) ctx.addIssue({ code: 'custom', path: ['location'], message: 'A food bank needs a physical collection venue' });
      if (data.isRecurring || data.repeat !== 'NONE') ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Use one date range for food collection' });
      if (data.foodBankTotalMeals !== undefined && data.foodBankSlotCapacity !== undefined && data.foodBankSlotCapacity > data.foodBankTotalMeals)
        ctx.addIssue({ code: 'custom', path: ['foodBankSlotCapacity'], message: 'Window capacity cannot exceed total meals' });
      if (
        data.foodBankTotalMeals !== undefined &&
        data.foodBankSlotCapacity !== undefined &&
        data.foodBankSlotMinutes !== undefined &&
        dateTimeSchema.shape.startTime.safeParse(data.startTime).success &&
        dateTimeSchema.shape.endTime.safeParse(data.endTime).success
      ) {
        const starts = new Date(buildEventDateTimeIso(data.startDate, data.startTime));
        const ends = new Date(buildEventDateTimeIso(data.endDate, data.endTime));
        const windows = Math.ceil(
          (ends.getTime() - starts.getTime()) / (data.foodBankSlotMinutes * 60_000),
        );
        if (windows < 1 || windows * data.foodBankSlotCapacity < data.foodBankTotalMeals)
          ctx.addIssue({
            code: "custom",
            path: ["foodBankSlotCapacity"],
            message: "Extend collection hours or increase people per window to fit all meals",
          });
      }
    }
    if (data.registrationType === "registration" || data.registrationType === "ticket") {
      const pricing = eventPricingSchema.safeParse({
        ...data,
        paid: data.registrationFee !== 0,
        limited: data.registrationAttendees !== DEFAULT_REGISTRATION_CAPACITY,
      });
      if (!pricing.success) {
        for (const issue of pricing.error.issues) {
          ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
        }
      }
    }
    if (data.registrationType === "donation" && data.donationTarget === undefined) {
      ctx.addIssue({ code: "custom", path: ["donationTarget"], message: "Set a fundraising target" });
    }
    if (data.registrationType === "volunteer" && data.volunteerRoles.length === 0) {
      ctx.addIssue({ code: "custom", path: ["volunteerRoles"], message: "Add at least one volunteer role" });
    }
    if (data.registrationType !== "volunteer" && data.volunteerRoles.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["volunteerRoles"],
        message: "Volunteer roles are only available for Volunteer and donation events",
      });
    }
    if (data.registrationType === "volunteer" && !canRecruitVolunteers(data)) {
      ctx.addIssue({
        code: "custom",
        path: data.isPhysicalEvent ? ["impactDescription"] : ["volunteerRoles"],
        message: data.isPhysicalEvent ? VOLUNTEER_IMPACT_STORY_REQUIRED : "Volunteering requires a physical venue",
      });
    }
    if ((data.registrationType === "donation" || data.registrationType === "foodbank" || (data.registrationType === "volunteer" && data.donationsEnabled)) &&
      data.donationTarget !== undefined && (!Number.isInteger(data.donationTarget) || data.donationTarget < 500000)) {
      ctx.addIssue({ code: "custom", path: ["donationTarget"], message: "Use a target of at least ₦5,000" });
    }
    if (data.isPhysicalEvent && data.location.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "Location is required for a physical event",
      });
    }
  });

export const dateTimeSchema = z
  .object({
    startDate: z.coerce.date({ message: "Invalid start date" }),
    endDate: z.coerce.date({ message: "Invalid end date" }),

    isRecurring: z.boolean(),

    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time"),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time"),

    repeat: z.enum(["DAILY", "WEEKLY", "NONE"]).optional(),
    endRepeat: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    const {
      startDate,
      endDate,
      startTime,
      endTime,
      isRecurring,
      repeat,
      endRepeat,
    } = data;

    const now = new Date();

    // Combine start date and time into a single Date object
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    // Combine end date and time
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Check if start date & time is at least 30 minutes in the future
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
    if (startDateTime < thirtyMinutesLater) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Event must start at least 30 minutes from now",
      });
    }

    // Basic range check
    if (endDate < startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after start date",
      });
      return;
    }

    // Inclusive day count
    const daysBetween =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    // Recurring validations
    if (isRecurring) {
      if (!repeat) {
        ctx.addIssue({
          code: "custom",
          path: ["repeat"],
          message: "Choose a repeat option (DAILY or WEEKLY)",
        });
      } else {
        if (repeat === "DAILY" && daysBetween !== 1) {
          ctx.addIssue({
            code: "custom",
            path: ["repeat"],
            message: "Daily repeat is only allowed for a single day",
          });
        }

        if (repeat === "WEEKLY" && daysBetween >= 7) {
          ctx.addIssue({
            code: "custom",
            path: ["repeat"],
            message:
              "Weekly repeat is allowed only for ranges less than 7 days",
          });
        }
      }
    }

    // End time must be after start time for single day
    if (daysBetween === 1 && endDateTime <= startDateTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time for a single-day event",
      });
    }

    // endRepeat must be after endDate
    if (endRepeat && endRepeat <= endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endRepeat"],
        message: "End repeat must be after the event end date",
      });
    }
  });

export const dateTimeEditSchema = z
  .object({
    startDate: z.coerce.date({ message: "Invalid start date" }),
    endDate: z.coerce.date({ message: "Invalid end date" }),

    isRecurring: z.boolean(),

    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time"),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time"),

    repeat: z.enum(["DAILY", "WEEKLY", "NONE"]).optional(),
    endRepeat: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    const {
      startDate,
      endDate,
      startTime,
      endTime,
      isRecurring,
      repeat,
      endRepeat,
    } = data;

    const now = new Date();

    // Combine start date and time into a single Date object
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    // Combine end date and time
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Check if start date & time is at least 30 minutes in the future
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
    if (endDateTime < thirtyMinutesLater) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date has to be in the future",
      });
    }

    // Basic range check
    if (endDate < startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after start date",
      });
      return;
    }

    // Inclusive day count
    const daysBetween =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    // Recurring validations
    if (isRecurring) {
      if (!repeat) {
        ctx.addIssue({
          code: "custom",
          path: ["repeat"],
          message: "Choose a repeat option (DAILY or WEEKLY)",
        });
      } else {
        if (repeat === "DAILY" && daysBetween !== 1) {
          ctx.addIssue({
            code: "custom",
            path: ["repeat"],
            message: "Daily repeat is only allowed for a single day",
          });
        }

        if (repeat === "WEEKLY" && daysBetween >= 7) {
          ctx.addIssue({
            code: "custom",
            path: ["repeat"],
            message:
              "Weekly repeat is allowed only for ranges less than 7 days",
          });
        }
      }
    }

    // End time must be after start time for single day
    if (daysBetween === 1 && endDateTime <= startDateTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time for a single-day event",
      });
    }

    // endRepeat must be after endDate
    if (endRepeat && endRepeat <= endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endRepeat"],
        message: "End repeat must be after the event end date",
      });
    }
  });

export const eventPricingSchema = z
  .object({
    registrationType: z.enum(["ticket", "registration", "donation"]),
    paid: z.boolean(),
    registrationFee: z
      .union([
        z.number().min(0, "Registration fee must be 0 or more"),
        z.string().transform((val) => (val === "" ? undefined : Number(val))),
      ])
      .optional(),
    donationTarget: z // Add donation target field
      .union([
        z.number().min(500000, "Donation target must be at least ₦5,000"),
        z.string().transform((val) => (val === "" ? undefined : Number(val))),
      ])
      .optional(),
    registrationAttendees: z
      .union([
        z.number().min(1, "Must have at least 1 attendee"),
        z.string().transform((val) => (val === "" ? undefined : Number(val))),
      ])
      .optional(),
    limited: z.boolean(),
    tickets: z.array(eventTicketSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const {
      registrationType,
      paid,
      registrationFee,
      limited,
      registrationAttendees,
      tickets,
      donationTarget,
    } = data;

    // Registration fee validation
    if (
      registrationType === "registration" &&
      paid &&
      (!registrationFee || registrationFee < 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationFee"],
        message: "Registration fee is required when event is not free",
      });
    }

    // Registration attendees validation
    if (
      registrationType === "registration" &&
      limited &&
      (!registrationAttendees || registrationAttendees < 1)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationAttendees"],
        message: "Number of attendees is required when registration is limited",
      });
    }

    // Tickets validation
    if (registrationType === "ticket" && (!tickets || tickets.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["tickets"],
        message:
          "At least one ticket is required when registration type is ticket",
      });
    }

    // Donation target validation - NEW
    if (
      registrationType === "donation" &&
      (!donationTarget || donationTarget < 500000)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["donationTarget"],
        message: "Donation target must be at least ₦5,000",
      });
    }
  });

export const donationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().min(50000, "Minimum donation is ₦500,000"), // in kobo
  status: z
    .enum(["pending", "active", "completed", "refunded"])
    .default("active"),
  createdAt: z.date(),
  transactionId: z.string(),
  eventId: z.string().uuid(),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

export type Donation = z.infer<typeof donationSchema>;
export type EventTicket = z.infer<typeof eventTicketSchema>;

export type EventPricing = z.infer<typeof eventPricingSchema>;
export type EventPricingFormData = z.input<typeof eventPricingSchema>;

export type DateTimeFormData = z.infer<typeof dateTimeSchema>;

export type DateTimeFormDataEditMode = z.infer<typeof dateTimeEditSchema>;

export type EventFormData = z.infer<typeof eventSchema>;
