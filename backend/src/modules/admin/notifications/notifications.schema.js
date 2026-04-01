import { z } from "zod";

const notificationIdSchema = z.string().uuid();
const notificationsLimitSchema = z.coerce.number().int().min(1).max(200).default(50);
const notificationsOffsetSchema = z.coerce.number().int().min(0).default(0);
const optionalAdminIdSchema = z.string().uuid().optional();

const notificationIdsSchema = z.array(notificationIdSchema).min(1).max(200);

export const listAdminNotificationsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    adminId: optionalAdminIdSchema,
    limit: notificationsLimitSchema,
    offset: notificationsOffsetSchema,
    read: z.enum(["read", "unread"]).optional(),
  }),
});

export const updateNotificationReadStateSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    notificationId: notificationIdSchema,
  }),
  body: z.object({
    adminId: optionalAdminIdSchema,
    isRead: z.boolean(),
  }),
});

export const bulkUpdateNotificationReadStateSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  body: z
    .object({
      adminId: optionalAdminIdSchema,
      notificationIds: notificationIdsSchema.optional(),
      markAll: z.boolean().optional().default(false),
      isRead: z.boolean(),
    })
    .superRefine((payload, ctx) => {
      const hasIds = Array.isArray(payload.notificationIds) && payload.notificationIds.length > 0;
      if (!payload.markAll && !hasIds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notificationIds"],
          message: "notificationIds is required when markAll is false.",
        });
      }
    }),
});

export const clearNotificationsSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  body: z
    .object({
      adminId: optionalAdminIdSchema,
      notificationIds: notificationIdsSchema.optional(),
      clearAll: z.boolean().optional().default(false),
    })
    .superRefine((payload, ctx) => {
      const hasIds = Array.isArray(payload.notificationIds) && payload.notificationIds.length > 0;
      if (!payload.clearAll && !hasIds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notificationIds"],
          message: "notificationIds is required when clearAll is false.",
        });
      }
    }),
});
