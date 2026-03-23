import { z } from "zod";

const reportIdSchema = z.string().uuid();
const transferRequestIdSchema = z.string().uuid();
const persistedStatusSchema = z.enum([
  "pending",
  "in_review",
  "resolved",
  "rejected",
]);

export const listAdminReportsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    status: persistedStatusSchema.optional(),
  }),
});

export const getAdminReportByIdSchema = z.object({
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  params: z.object({
    reportId: reportIdSchema,
  }),
});

export const updateAdminReportSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    reportId: reportIdSchema,
  }),
  body: z.object({
    status: persistedStatusSchema,
  }),
});

export const listTransferRequestsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const createTransferRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    requestedDepartmentId: z.string().trim().min(1).max(64),
    requestedDepartmentLabel: z.string().trim().min(1).max(160).optional(),
    reason: z.string().trim().min(3).max(1000),
  }),
});

export const reviewTransferRequestSchema = z.object({
  params: z.object({
    id: transferRequestIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z.object({
    reviewNotes: z.string().trim().min(1).max(1000).optional(),
  }),
});

export const rejectTransferRequestSchema = z.object({
  params: z.object({
    id: transferRequestIdSchema,
  }),
  query: z.object({}).optional().default({}),
  body: z.object({
    reviewNotes: z.string().trim().min(1).max(1000),
  }),
});

export const listOfficeAdminsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const assignOfficeDepartmentSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    adminId: z.string().uuid(),
  }),
  body: z.object({
    departmentId: z.string().trim().min(1).max(64),
    departmentLabel: z.string().trim().min(1).max(160).optional(),
  }),
});
