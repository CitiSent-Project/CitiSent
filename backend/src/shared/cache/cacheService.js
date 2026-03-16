import { createClient } from "redis";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

class MemoryCacheStore {
  constructor(maxItems) {
    this.maxItems = maxItems;
    this.store = new Map();
  }

  get(key) {
    const record = this.store.get(key);

    if (!record) return null;

    if (record.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return record.value;
  }

  set(key, value, ttlSeconds) {
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  deleteByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

class CacheService {
  constructor() {
    this.memory = new MemoryCacheStore(env.CACHE_MAX_ITEMS);
    this.redisClient = null;
    this.redisInitPromise = null;
  }

  shouldUseRedis() {
    if (env.CACHE_DRIVER === "memory") return false;
    if (env.CACHE_DRIVER === "redis") return true;

    return Boolean(env.REDIS_URL);
  }

  async getRedisClient() {
    if (!this.shouldUseRedis()) return null;
    if (!env.REDIS_URL) return null;
    if (this.redisClient?.isOpen) return this.redisClient;

    if (this.redisClient && !this.redisClient.isOpen) {
      this.redisClient = null;
      this.redisInitPromise = null;
    }

    if (!this.redisInitPromise) {
      this.redisInitPromise = (async () => {
        const client = createClient({ url: env.REDIS_URL });

        client.on("error", (error) => {
          logger.warn("Redis client error", { message: error.message });
        });

        await client.connect();
        this.redisClient = client;

        logger.info("Connected to Redis cache", {
          driver: "redis",
        });

        this.redisInitPromise = null;

        return client;
      })().catch((error) => {
        logger.warn("Redis unavailable, using memory cache", {
          message: error.message,
        });
        this.redisClient = null;
        this.redisInitPromise = null;
        return null;
      });
    }

    return this.redisInitPromise;
  }

  async getJSON(key) {
    try {
      const client = await this.getRedisClient();

      if (client) {
        const raw = await client.get(key);
        return raw ? JSON.parse(raw) : null;
      }
    } catch (error) {
      logger.warn("Redis get failed, using memory fallback", {
        key,
        message: error.message,
      });
    }

    return this.memory.get(key);
  }

  async setJSON(key, value, ttlSeconds = env.CACHE_TTL_SECONDS) {
    try {
      const client = await this.getRedisClient();

      if (client) {
        await client.set(key, JSON.stringify(value), {
          EX: ttlSeconds,
        });
        return;
      }
    } catch (error) {
      logger.warn("Redis set failed, using memory fallback", {
        key,
        message: error.message,
      });
    }

    this.memory.set(key, value, ttlSeconds);
  }

  async deleteByPrefix(prefix) {
    try {
      const client = await this.getRedisClient();

      if (client) {
        const keys = [];

        for await (const key of client.scanIterator({
          MATCH: `${prefix}*`,
          COUNT: 100,
        })) {
          keys.push(key);
        }

        if (keys.length > 0) {
          await client.del(keys);
        }

        return;
      }
    } catch (error) {
      logger.warn("Redis prefix invalidation failed, using memory fallback", {
        prefix,
        message: error.message,
      });
    }

    this.memory.deleteByPrefix(prefix);
  }
}

export const cacheService = new CacheService();
