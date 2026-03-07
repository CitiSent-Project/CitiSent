import { Config } from "../constants/config";

const BASE_URL = Config.API_BASE_URL;

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const rawBody = await response.text();
  let parsedBody;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    const backendMessage =
      typeof parsedBody === "object" && parsedBody !== null
        ? parsedBody.message || parsedBody.error
        : undefined;
    throw new Error(backendMessage || `Request failed (${response.status})`);
  }

  return parsedBody ?? null;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};
