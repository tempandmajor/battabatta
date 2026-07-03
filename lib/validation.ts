import { z } from "zod";

// Mirrors the database constraints in supabase/migrations so users get
// friendly errors before a write is attempted.

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password")
});

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,32}$/, "Handles are 3-32 characters: lowercase letters, numbers, underscores");

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is too short").max(80, "Display name is too long"),
  handle: handleSchema,
  bio: z.string().trim().max(800, "Bio must be at most 800 characters").default(""),
  publicLocationLabel: z.string().trim().max(120, "Location label is too long").default(""),
  locationMode: z.enum(["local", "online", "local_and_online"]),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isAdultConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 18 or older" })
  }),
  acceptsTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Use and Privacy Policy" })
  })
});

export const profileUpdateSchema = onboardingSchema
  .omit({ isAdultConfirmed: true, acceptsTerms: true })
  .extend({
    isPaused: z.coerce.boolean().default(false),
    interests: z
      .array(z.string().trim().min(2).max(80))
      .max(20, "At most 20 interests")
      .default([])
  });

export const postSchema = z
  .object({
    kind: z.enum(["offering", "seeking"]),
    category: z.enum(["goods", "services"]),
    title: z.string().trim().min(4, "Title must be at least 4 characters").max(140, "Title must be at most 140 characters"),
    body: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description must be at most 2000 characters"),
    whatICanGive: z.string().trim().max(500, "Must be at most 500 characters").default(""),
    locationMode: z.enum(["local", "online", "local_and_online"]),
    approvalPolicy: z.enum(["auto_accept_until_limit", "manual_approval"]),
    availabilityTotal: z.coerce.number().int().min(1).max(1000).optional(),
    availabilityUnit: z.string().trim().min(2).max(80).optional()
  })
  .superRefine((value, ctx) => {
    if (value.availabilityTotal !== undefined && !value.availabilityUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availabilityUnit"],
        message: "Describe the unit, e.g. 'produce boxes' or 'tutoring slots'"
      });
    }
  });

export const offerSchema = z.object({
  recipientId: z.string().uuid(),
  postId: z.string().uuid().optional(),
  offeredItem: z.string().trim().min(2, "Describe what you are offering").max(240),
  requestedItem: z.string().trim().min(2, "Describe what you are requesting").max(240),
  timing: z.string().trim().max(240).default(""),
  note: z.string().trim().max(2000).default("")
});

export const offerActionSchema = z.enum(["interested", "countered", "declined", "withdrawn", "closed"]);

export const messageSchema = z.object({
  offerId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a message").max(4000, "Messages are limited to 4000 characters")
});

export const reportSchema = z.object({
  reason: z.string().trim().min(4, "Tell us what happened (at least 4 characters)").max(500),
  reportedProfileId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional()
});

export const checkoutSchema = z.object({
  mode: z.enum(["donation", "supporter"]),
  amount: z.number().int().min(100).max(100_000).optional()
});
