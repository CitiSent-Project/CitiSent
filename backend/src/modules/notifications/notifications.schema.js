import { z } from "zod";

const notificationIdSchema = z.string().uuid();

export const listNotificationsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    read: z.enum(["read", "unread"]).optional(),
    reportId: z.string().uuid().optional(),
  }),
});

export const updateNotificationReadStateSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    notificationId: notificationIdSchema,
  }),
  body: z.object({
    isRead: z.boolean(),
  }),
});

const notificationIdsSchema = z.array(notificationIdSchema).min(1).max(200);

export const bulkUpdateNotificationReadStateSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  body: z
    .object({
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
