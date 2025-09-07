import { z } from "zod";

export const eventTicketSchema = z.object({
    description: z.string().min(1, { message: "Description is required" }),
  
    limited: z.boolean().default(true),
  
    quantity: z.union([
        z.number().min(5, { message: "Quantity must be at least 5" }),
        z.string().transform((val) => val === '' ? null : Number(val))
      ]).optional(),
  
    paid: z.boolean().default(true),
    id:  z.uuidv4({ version: "v4" }),

    isVisible: z.boolean().default(true) ,
    updatedPrice: z.union([
      z.number().min(0, { message: "Price must be 0 or more" }),
      z.string().transform((val) => val === '' ? undefined: Number(val))
    ]).optional(),
    isNew: z.boolean().default(true),
    price: z.union([
        z.number().min(0, { message: "Price must be 0 or more" }),
        z.string().transform((val) => val === '' ? undefined : Number(val))
      ]).optional(),
    
  
    type: z.string().min(1, { message: "Type is required" }),
  
    perks: z.array(z.string()).optional(),
  }).superRefine((data, ctx) => {
    // Quantity validation
    if (data.limited && (data.quantity === undefined || data.quantity < 5)) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity must be at least 5 when stockType is limited",
        path: ["quantity"],
      });
    }
  
    // Price validation
    if (data.paid && (data.price === undefined || data.price < 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Price must be provided and ≥ 0 when priceType is paid",
        path: ["price"],
      });
    }
  
  
  });


  export const eventSchema = z.object({
  imgUrl: z.url().optional(),

  eventName: z.string()
    .min(1, "Event name is required")
    .max(100, "Event name must be at most 100 characters"),

    description: z.string()
    .min(1, "Event description is required")
    .max(100, "Event name must be at most 100 characters"),

  repeat: z.enum([ "WEEKLY", "DAILY","NONE"]),

  
  startDate: z.coerce.date({
    error: "Date and time is required"
  }),
  endDate: z.coerce.date(),
  startTime: z.string(),
  endTime: z.string(),
  endRepeat: z.coerce.date().optional(),
  isRecurring:z.boolean() ,

  location: z.string().min(1, "Location is required"),

  tags: z.array(z.string()),
  registrationType: z
  .enum(["ticket", "registration"],{
    error: "Pricing or registration is required"
  }),

  tickets: z.array(eventTicketSchema).optional(),
  registrationAttendees: z.number().optional(),
  registrationFee: z.number().optional()
})



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

    repeat: z.enum(["DAILY", "WEEKLY","NONE"]).optional(),
    endRepeat: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    const { startDate, endDate, startTime, endTime, isRecurring, repeat, endRepeat } = data;

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
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

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
            message: "Weekly repeat is allowed only for ranges less than 7 days",
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

    repeat: z.enum(["DAILY", "WEEKLY","NONE"]).optional(),
    endRepeat: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    const { startDate, endDate, startTime, endTime, isRecurring, repeat, endRepeat } = data;

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
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

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
            message: "Weekly repeat is allowed only for ranges less than 7 days",
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


  export const eventPricingSchema = z.object({
    registrationType: z.enum(["ticket", "registration"]),
    paid: z.boolean(),
    registrationFee: z.union([
        z.number().min(0, "Registration fee must be 0 or more"),
        z.string().transform((val) => val === '' ? undefined : Number(val))
      ]).optional(),

    registrationAttendees: z.union([
        z.number().min(1, "Must have at least 1 attendee"),
        z.string().transform((val) => val === '' ? undefined : Number(val))
      ]).optional(),
    limited: z.boolean(),
   
    tickets: z.array(eventTicketSchema).optional().default([]),
  }).superRefine((data, ctx) => {
    const { registrationType, paid, registrationFee, limited, registrationAttendees, tickets } = data;
  
    // Registration fee validation
    if (registrationType === "registration" && paid && (!registrationFee || registrationFee < 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationFee"],
        message: "Registration fee is required when event is not free",
      });
    }
  
    // Registration attendees validation
    if (registrationType === "registration" && limited && (!registrationAttendees || registrationAttendees < 1)) {
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
        message: "At least one ticket is required when registration type is ticket",
      });
    }
  
  
  });









export type EventTicket = z.infer<typeof eventTicketSchema>;

export type EventPricing = z.infer<typeof eventPricingSchema>;

export type DateTimeFormData = z.infer<typeof dateTimeSchema>;

export type DateTimeFormDataEditMode  = z.infer<typeof dateTimeEditSchema>;

export type EventFormData = z.infer<typeof eventSchema>;
