import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

app.listen(env.PORT, () => {
  logger.info("Backend server started", {
    port: env.PORT,
    env: env.NODE_ENV,
    apiPrefix: env.API_PREFIX,
  });
});
