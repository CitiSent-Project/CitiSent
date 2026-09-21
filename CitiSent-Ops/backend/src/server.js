import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { opsRouter } from "./routes/opsRoutes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Public Liveness Probe
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "citisent-ops-backend",
    port: env.PORT,
    timestamp: new Date().toISOString(),
  });
});

// Mount Protected Ops Router
app.use("/api/v1/ops", opsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(`[CitiSent-Ops Error] ${req.method} ${req.originalUrl}:`, err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CitiSent-Ops Dedicated API Server running on port ${env.PORT}`);
  console.log(`🔒 Control Plane Architecture: Isolated from Client Gateway`);
  console.log(`🌐 Base URL: http://localhost:${env.PORT}/api/v1/ops`);
  console.log(`=======================================================`);
});

export { app, server };
