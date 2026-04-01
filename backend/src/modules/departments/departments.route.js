import { Router } from "express";
import { DEPARTMENTS } from "../../shared/data/departments.js";

const departmentsRouter = Router();

// GET /api/departments - Returns the list of departments
/**
 * @route GET /api/departments
 * @desc Get the list of all departments (source-of-truth)
 * @access Public (or restrict as needed)
 */
departmentsRouter.get("/", (req, res) => {
  res.json({ departments: DEPARTMENTS });
});

export { departmentsRouter };