import { Router } from "express";
import { requireDeveloperAuth } from "../middleware/authMiddleware.js";
import { developerRegistrationLimiter, superadminProvisioningLimiter } from "../middleware/rateLimiter.js";
import {
  getDepartmentPresets,
  executeDepartmentSeed,
} from "../controllers/seedController.js";
import {
  listSuperadmins,
  provisionSuperadmin,
  resendInvite,
  unlockAccount,
  toggleAccountStatus,
} from "../controllers/superadminController.js";
import { registerDeveloperAccount } from "../controllers/developerAuthController.js";
import { getAuditLogs } from "../controllers/auditController.js";
import { getHealthStatus } from "../controllers/healthController.js";

const opsRouter = Router();

// Public monitoring endpoint (No Auth required so Docker/UptimeRobot can access it)
opsRouter.get("/health", getHealthStatus);

// Public first-time developer bootstrap (Strictly guarded by DEVELOPER_ALLOWED_EMAILS and Rate Limiter)
opsRouter.post("/register-dev", developerRegistrationLimiter, registerDeveloperAccount);

// Gated strictly with AppSec Developer Authentication & Whitelist
opsRouter.use(requireDeveloperAuth);

// Developer verification & status
opsRouter.get("/me", (req, res) => {
  res.json({
    success: true,
    data: {
      developer: req.developer,
      authenticated: true,
      timestamp: new Date().toISOString(),
    },
  });
});

// Municipal Department Seeding
opsRouter.get("/departments/preview", getDepartmentPresets);
opsRouter.post("/departments/seed", executeDepartmentSeed);

// Superadmin Lifecycle & Provisioning
opsRouter.get("/superadmins", listSuperadmins);
opsRouter.post("/superadmins", superadminProvisioningLimiter, provisionSuperadmin);
opsRouter.post("/superadmins/:id/resend-invite", superadminProvisioningLimiter, resendInvite);
opsRouter.post("/superadmins/:id/unlock", unlockAccount);
opsRouter.post("/superadmins/:id/status", toggleAccountStatus);

// Developer Audit Log Stream
opsRouter.get("/audit-logs", getAuditLogs);

export { opsRouter };
