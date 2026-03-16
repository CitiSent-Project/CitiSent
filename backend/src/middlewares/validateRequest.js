import { StatusCodes } from "http-status-codes";
import { AppError } from "../shared/errors/appError.js";

export function validateRequest(schema) {
  return function validate(req, _res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return next(
        new AppError(
          "Request validation failed",
          StatusCodes.BAD_REQUEST,
          details,
        ),
      );
    }

    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;

    return next();
  };
}
