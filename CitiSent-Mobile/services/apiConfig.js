import Constants from "expo-constants";
import { Platform } from "react-native";

import { Config } from "../constants/config";

const PLACEHOLDER_HOSTNAMES = new Set(["your-api-url.com"]);

function normalizeUrl(url) {
  if (typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
}

function isUsableApiUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";

    if (!isHttp) {
      return false;
    }

    return !PLACEHOLDER_HOSTNAMES.has(parsed.hostname);
  } catch {
    return false;
  }
}

function readExpoDebuggerHost() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
  ];

  for (const rawCandidate of candidates) {
    const candidate = normalizeUrl(rawCandidate);
    if (!candidate) {
      continue;
    }

    const hostPort = candidate.split("/")[0];
    const host = hostPort.split(":")[0];

    if (host) {
      return host;
    }
  }

  return "";
}

function buildLocalApiUrl() {
  const debuggerHost = readExpoDebuggerHost();

  const resolvedHost =
    debuggerHost || (Platform.OS === "android" ? "10.0.2.2" : "localhost");

  return `http://${resolvedHost}:${Config.API_PORT}${Config.API_PREFIX}`;
}

export function resolveApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (isUsableApiUrl(envUrl)) {
    return normalizeUrl(envUrl);
  }

  if (isUsableApiUrl(Config.API_BASE_URL)) {
    return normalizeUrl(Config.API_BASE_URL);
  }

  return buildLocalApiUrl();
}
