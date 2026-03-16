import { z } from "zod";

const allowedStatus = ["pending", "in_review", "resolved", "rejected"];

export const listReportsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    status: z.enum(allowedStatus).optional(),
  }),
});

export const createReportSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    issueType: z.string().min(1).max(120),
    description: z.string().min(10).max(3000),
    location: z.string().min(1).max(240),
    attachmentUrl: z.string().url().optional(),
    sentimentLabel: z.string().max(32).optional(),
  }),
});
