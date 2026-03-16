import { Router } from "express";
import { healthRouter } from "../modules/health/health.route.js";
import { reportsRouter } from "../modules/reports/reports.route.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/reports", reportsRouter);

export { apiRouter };
