import { z } from "zod";

const optionalAdminIdSchema = z.string().uuid().optional();

export const listAdminActivityLogSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    adminId: optionalAdminIdSchema,
    limit: z.coerce.number().int().min(1).max(300).default(100),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

export const createAdminActivityLogSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    adminId: optionalAdminIdSchema,
    action: z.string().trim().min(1).max(160),
    detail: z.string().trim().max(2000).default(""),
  }),
});
