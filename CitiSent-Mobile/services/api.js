import { resolveApiBaseUrl } from "./apiConfig";
import { getAuthToken } from "./authSession";

const BASE_URL = resolveApiBaseUrl();

function buildRequestUrl(endpoint) {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  return `${BASE_URL}${normalizedEndpoint}`;
}

function buildHeaders(customHeaders) {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
}

async function request(endpoint, options = {}) {
  const { headers, ...requestOptions } = options;

  const response = await fetch(buildRequestUrl(endpoint), {
    headers: buildHeaders(headers),
    ...requestOptions,
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
