import { z } from "zod";

function optionalTrimmedString(schema) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length ? trimmedValue : undefined;
  }, schema.optional());
}

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[a-zA-Z0-9_]+$/);
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/);

export const registerSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    username: usernameSchema,
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
    fname: z.string().trim().min(1).max(120),
    mname: z.string().trim().min(1).max(120).nullish(),
    lname: z.string().trim().min(1).max(120),
    phoneNumber: phoneSchema.nullish(),
    role: z.string().trim().min(1).max(40).nullish(),
    accountType: z.string().trim().min(1).max(24).nullish(),
    departmentId: z.string().trim().min(1).max(64).nullish(),
    departmentLabel: z.string().trim().min(1).max(120).nullish(),
    age: z.coerce.number().int().min(1).max(120).nullish(),
    gender: z.string().trim().min(1).max(24).nullish(),
    clientType: z.string().trim().min(1).max(32).nullish(),
    barangay: z.string().trim().min(1).max(120).nullish(),
    profileImage: z.string().trim().max(1024).nullish(),
  }),
});

export const loginSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z
    .object({
      identifier: optionalTrimmedString(z.string().min(1)),
      email: optionalTrimmedString(z.string().email()),
      username: optionalTrimmedString(usernameSchema),
      phoneNumber: optionalTrimmedString(phoneSchema),
      password: z.string().min(1).max(128),
    })
    .superRefine((payload, ctx) => {
      const hasIdentifier =
        Boolean(payload.identifier) ||
        Boolean(payload.email) ||
        Boolean(payload.username) ||
        Boolean(payload.phoneNumber);

      if (!hasIdentifier) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identifier"],
          message:
            "An identifier (email, username, or phone number) is required.",
        });
      }
    }),
});

export const forgotPasswordSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    email: z.string().trim().email(),
  }),
});

export const activateAccountSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    token: z.string().trim().min(1),
    password: z.string().min(8).max(128),
  }),
});

export const meSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export const changePasswordSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(128),
  }),
});
