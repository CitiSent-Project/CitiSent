import { Router } from "express";
import { getHealth, getSupabaseHealth } from "./health.controller.js";

const healthRouter = Router();

healthRouter.get("/", getHealth);
healthRouter.get("/supabase", getSupabaseHealth);

export { healthRouter };
