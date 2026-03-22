import { Router } from "express";
import { healthRouter } from "../modules/health/health.route.js";
import { reportsRouter } from "../modules/reports/reports.route.js";
import { authRouter } from "../modules/auth/auth.route.js";
import { usersRouter } from "../modules/users/users.route.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/reports", reportsRouter);

export { apiRouter };
