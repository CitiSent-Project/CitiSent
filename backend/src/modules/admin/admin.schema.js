import { z } from "zod";
import { USER_ROLES } from "../../shared/auth/roleAccess.js";

const reportIdSchema = z.string().uuid();
const userIdSchema = z.string().uuid();
const transferRequestIdSchema = z.string().uuid();
const persistedStatusSchema = z.enum([
  "pending",
  "in_review",
  "resolved",
  "rejected",
]);
const profileStatusSchema = z.enum(["active", "banned"]);
const accountTypeSchema = z.enum(["admin", "citizen"]);
const adminRoleSchema = z.enum([USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN]);
const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[A-Za-z0-9_]+$/);
const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/);
const citySchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .refine(
    (value) => {
      const normalized = String(value || '').toLowerCase().replace(/[\s.]/g, '');
      return normalized === 'stotomas' || normalized === 'santotomas';
    },
    { message: 'City must be Sto. Tomas.' },
  );
const dashboardLimitSchema = z.coerce.number().int().min(1).max(20).default(5);

export const listAdminUsersSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    search: z.string().trim().min(1).max(120).optional(),
    status: profileStatusSchema.optional(),
  }),
});

export const getAdminUserByIdSchema = z.object({
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  params: z.object({
    userId: userIdSchema,
  }),
});

export const createAdminUserSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    email: z.string().trim().email().max(254),
    fname: z.string().trim().min(1).max(120),
    mname: z.string().trim().min(1).max(120).nullable().optional(),
    lname: z.string().trim().min(1).max(120),
    username: usernameSchema.optional(),
    phoneNumber: phoneNumberSchema.optional(),
    barangay: z.string().trim().min(1).max(160),
    city: citySchema.optional(),
    province: z.string().trim().min(1).max(160).optional(),
    accountType: accountTypeSchema.optional().default("citizen"),
    role: adminRoleSchema.optional(),
    departmentId: z.string().trim().min(1).max(64).optional(),
    departmentLabel: z.string().trim().min(1).max(160).optional(),
    status: profileStatusSchema.optional().default("active"),
  }),
});

export const updateAdminUserSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    userId: userIdSchema,
  }),
  body: z
    .object({
      fname: z.string().trim().min(1).max(120).optional(),
      mname: z.string().trim().min(1).max(120).nullable().optional(),
      lname: z.string().trim().min(1).max(120).optional(),
      username: usernameSchema.optional(),
      phoneNumber: phoneNumberSchema.optional(),
      barangay: z.string().trim().min(1).max(160).optional(),
      city: citySchema.optional(),
      province: z.string().trim().min(1).max(160).optional(),
      role: adminRoleSchema.optional(),
      departmentId: z.string().trim().min(1).max(64).optional(),
      departmentLabel: z.string().trim().min(1).max(160).optional(),
      status: profileStatusSchema.optional(),
    })
    .superRefine((payload, ctx) => {
      if (Object.keys(payload).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["body"],
          message: "At least one field is required to update a user.",
        });
      }
    }),
});

export const banAdminUserSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    userId: userIdSchema,
  }),
  body: z.object({
    reason: z.string().trim().min(3).max(500).optional(),
  }),
});

export const unbanAdminUserSchema = z.object({
  query: z.object({}).optional().default({}),
  params: z.object({
    userId: userIdSchema,
  }),
  body: z.object({}).optional().default({}),
});

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

export const getDashboardSummarySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const getDashboardReportsByStatusSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const getDashboardReportsByCategorySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const getDashboardWeeklyTrendSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const getDashboardRecentAdminsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    limit: dashboardLimitSchema,
  }),
});

export const getDashboardRecentUsersSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    limit: dashboardLimitSchema,
  }),
});
