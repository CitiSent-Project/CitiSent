import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const PREFIX = "@citisent_cache_";
const memoryStorage = new Map();

/**
 * Universal storage adapter supporting Native AsyncStorage, Web localStorage, and Memory fallback
 */
const storageAdapter = {
  getItem: async (key) => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch {}
      return memoryStorage.get(key) || null;
    }

    try {
      return await AsyncStorage.getItem(key);
    } catch {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch {}
      return memoryStorage.get(key) || null;
    }
  },

  setItem: async (key, value) => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch {}
      memoryStorage.set(key, value);
      return;
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch {}
      memoryStorage.set(key, value);
    }
  },

  removeItem: async (key) => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch {}
      memoryStorage.delete(key);
      return;
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch {}
      memoryStorage.delete(key);
    }
  },

  clear: async () => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(PREFIX));
          keys.forEach((k) => window.localStorage.removeItem(k));
          return;
        }
      } catch {}
      memoryStorage.clear();
      return;
    }

    try {
      const keys = await AsyncStorage.getAllKeys();
      const citisentKeys = keys.filter((k) => k.startsWith(PREFIX));
      if (citisentKeys.length > 0) {
        await AsyncStorage.multiRemove(citisentKeys);
      }
    } catch {
      memoryStorage.clear();
    }
  },
};

/**
 * Store item in persistent cache with optional TTL (in seconds)
 */
export async function setCache(key, data, ttlSeconds = null) {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds ? ttlSeconds * 1000 : null,
    };
    await storageAdapter.setItem(`${PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    // Silent failover to prevent unhandled UI disruptions
  }
}

/**
 * Retrieve item from persistent cache. Returns null if expired or missing.
 * Pass { ignoreExpiry: true } to fetch stale data when offline.
 */
export async function getCache(key, options = {}) {
  try {
    const jsonStr = await storageAdapter.getItem(`${PREFIX}${key}`);
    if (!jsonStr) return null;

    const item = JSON.parse(jsonStr);
    if (!item || typeof item !== "object") return null;

    if (!options.ignoreExpiry && item.ttl && Date.now() - item.timestamp > item.ttl) {
      // Cache expired
      return null;
    }

    return item.data;
  } catch {
    return null;
  }
}

/**
 * Remove a specific key from persistent cache
 */
export async function removeCache(key) {
  try {
    await storageAdapter.removeItem(`${PREFIX}${key}`);
  } catch {}
}

/**
 * Clear all citisent cache keys
 */
export async function clearAllCache() {
  try {
    await storageAdapter.clear();
  } catch {}
}
