import { sha256 } from 'js-sha256';

import { redis } from '@colanode/server/data/redis';
import { createLogger } from '@colanode/server/lib/logger';

interface RateLimitConfig {
  limit: number;
  window: number;
}

const defaultConfig: RateLimitConfig = {
  limit: 10,
  window: 300, // 5 minutes
};

const logger = createLogger('server:lib:rate-limits');

const isRateLimited = async (
  key: string,
  config: RateLimitConfig = defaultConfig
): Promise<boolean> => {
  if (!redis.isOpen) {
    return false;
  }

  const redisKey = `rt:${key}`;

  try {
    const attempts = await redis.incr(redisKey);

    if (attempts === 1) {
      await redis.expire(redisKey, config.window);
    }

    return attempts > config.limit;
  } catch (error) {
    logger.warn({ err: error, key: redisKey }, 'Rate limit check skipped');
    return false;
  }
};

export const isAuthIpRateLimited = async (ip: string): Promise<boolean> => {
  return await isRateLimited(`ai:${ip}`, {
    limit: 100,
    window: 600, // 10 minutes
  });
};

export const isAuthEmailRateLimited = async (
  email: string
): Promise<boolean> => {
  const emailHash = sha256(email);
  return await isRateLimited(`ae:${emailHash}`, {
    limit: 10,
    window: 600, // 10 minutes
  });
};

export const isDeviceApiRateLimited = async (
  deviceId: string
): Promise<boolean> => {
  return await isRateLimited(`da:${deviceId}`, {
    limit: 100,
    window: 60, // 1 minute
  });
};

export const isDeviceSocketRateLimited = async (
  deviceId: string
): Promise<boolean> => {
  return await isRateLimited(`ds:${deviceId}`, {
    limit: 20,
    window: 60, // 1 minute
  });
};
