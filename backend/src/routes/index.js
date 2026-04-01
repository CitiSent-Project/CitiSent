import { Router } from "express";
import { healthRouter } from "../modules/health/health.route.js";
import { reportsRouter } from "../modules/reports/reports.route.js";
import { authRouter } from "../modules/auth/auth.route.js";
import { usersRouter } from "../modules/users/users.route.js";
import { adminRouter } from "../modules/admin/admin.route.js";
import { departmentsRouter } from "../modules/departments/departments.route.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/departments", departmentsRouter);

export { apiRouter };
