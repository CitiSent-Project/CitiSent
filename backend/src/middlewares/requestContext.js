import crypto from "node:crypto";

export function requestContext(req, res, next) {
  const requestId = crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}
