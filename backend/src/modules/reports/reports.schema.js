import { z } from "zod";

const allowedStatus = ["pending", "in_review", "resolved", "rejected"];
const reportIdSchema = z.string().uuid();

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
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    attachmentUrl: z.string().url().optional(),
    // Cloudflare Turnstile token — required for guest users, validated server-side.
    // Optional here because registered users do not send it.
    turnstileToken: z.string().min(1).max(4096).optional(),
  }),
});


export const getReportByIdSchema = z.object({
  params: z.object({
    reportId: reportIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export const updateReportSchema = z.object({
  params: z.object({
    reportId: reportIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z
    .object({
      issueType: z.string().min(1).max(120).optional(),
      description: z.string().min(10).max(3000).optional(),
      location: z.string().min(1).max(240).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      attachmentUrl: z.string().url().nullable().optional(),
      status: z.enum(allowedStatus).optional(),
    })
    .strict()
    .superRefine((payload, ctx) => {
      if (Object.keys(payload).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["body"],
          message: "At least one field is required to update a report.",
        });
      }
    }),
});

export const deleteReportSchema = z.object({
  params: z.object({
    reportId: reportIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});
