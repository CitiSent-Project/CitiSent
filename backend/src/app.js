import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import { StatusCodes } from "http-status-codes";

import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { requestContext } from "./middlewares/requestContext.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { AppError } from "./shared/errors/appError.js";

const app = express();

function requestTimeout(timeoutMs) {
  return function timeoutMiddleware(req, res, next) {
    const timer = setTimeout(() => {
      if (res.headersSent) {
        return;
      }

      const timeoutError = new AppError(
        "Request timed out",
        StatusCodes.GATEWAY_TIMEOUT,
        {
          timeoutMs,
          method: req.method,
          path: req.originalUrl,
        },
      );
      timeoutError.code = "REQUEST_TIMEOUT";
      next(timeoutError);
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(requestContext);
app.use(helmet());
app.use(hpp());
app.use(compression());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestTimeout(env.REQUEST_TIMEOUT_MS));

app.use(env.API_PREFIX, apiRouter);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CitiSent backend running",
  });
});

app.use(notFound);
app.use(errorHandler);

export { app };
