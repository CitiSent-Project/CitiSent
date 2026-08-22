import { Router } from "express";
import {
  getHealth,
  getLiveness,
  getReadiness,
  getSupabaseHealth,
} from "./health.controller.js";

const healthRouter = Router();

healthRouter.get("/", getHealth);
healthRouter.get("/live", getLiveness);
healthRouter.get("/ready", getReadiness);
healthRouter.get("/supabase", getSupabaseHealth);

export { healthRouter };
