import { z } from "zod";

const departmentSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const listDepartmentsSchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({
    includeInactive: z.coerce.boolean().optional().default(false),
  }),
});

export const createDepartmentSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    slug: departmentSlugSchema,
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(600).optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    departmentSlug: departmentSlugSchema,
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(160).optional(),
      description: z.string().trim().max(600).optional(),
    })
    .superRefine((payload, ctx) => {
      if (Object.keys(payload).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["body"],
          message: "At least one field is required.",
        });
      }
    }),
});

export const setDepartmentActiveSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    departmentSlug: departmentSlugSchema,
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const departmentLogoSchema = z.object({
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  params: z.object({
    departmentSlug: departmentSlugSchema,
  }),
});

export const deleteDepartmentSchema = z.object({
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  params: z.object({
    departmentSlug: departmentSlugSchema,
  }),
});
