import { z } from "zod";

const reportIdSchema = z.string().uuid();
const messageIdSchema = z.string().uuid();

export const listReportMessagesSchema = z.object({
  params: z.object({
    reportId: reportIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export const sendReportMessageSchema = z.object({
  params: z.object({
    reportId: reportIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z
    .object({
      message: z.string().trim().min(1).max(4000),
    })
    .strict(),
});

export const markReportMessagesReadSchema = z.object({
  params: z.object({
    reportId: reportIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z
    .object({
      messageIds: z.array(messageIdSchema).optional(),
    })
    .strict(),
});
