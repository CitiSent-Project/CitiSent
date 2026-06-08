import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[a-zA-Z0-9_]+$/);
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+639\d{9}$/, {
    message: "Phone number must be a valid Philippine mobile number starting with +639.",
  });
const citySchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => {
      const normalized = String(value || '').toLowerCase().replace(/[\s.]/g, '');
      return normalized === 'stotomas' || normalized === 'santotomas';
    },
    { message: 'City must be Sto. Tomas.' },
  );

export const getCurrentUserSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const deleteCurrentUserSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const updateCurrentUserSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z
    .object({
      username: usernameSchema.optional(),
      phoneNumber: phoneSchema.optional(),
      age: z.coerce.number().int().min(1).max(120).optional(),
      gender: z.string().trim().min(1).max(24).optional(),
      clientType: z.string().trim().min(1).max(32).optional(),
      avatarUrl: z.string().url().optional(),
      fname: z.string().trim().min(1).max(120).optional(),
      mname: z.string().trim().min(1).max(120).nullable().optional(),
      lname: z.string().trim().min(1).max(120).optional(),
      email: z.string().trim().email().optional(),
      barangay: z.string().trim().min(1).optional(),
      city: citySchema.optional(),
      province: z.string().trim().min(1).optional(),
    })
    .superRefine((payload, ctx) => {
      if (Object.keys(payload).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["body"],
          message: "At least one field is required to update your profile.",
        });
      }
    }),
});
