// ============================================================
// Auth Service — Redis Configuration
// ============================================================

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 10) {
          logger.error('Redis: Max retries reached');
          return null;
        }
        return Math.min(times * 200, 5000);
      },
      lazyConnect: true,
    });

    await redisClient.connect();

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    logger.info('Redis connected');
    return redisClient;
  } catch (err) {
    logger.error('Redis connection failed:', err);
    throw err;
  }
};

const getRedis = () => redisClient;

// Token blacklist operations
const blacklistToken = async (token, expiresIn) => {
  if (!redisClient) return;
  await redisClient.setex(`blacklist:${token}`, expiresIn, 'true');
};

const isTokenBlacklisted = async (token) => {
  if (!redisClient) return false;
  const result = await redisClient.get(`blacklist:${token}`);
  return result === 'true';
};

module.exports = { connectRedis, getRedis, blacklistToken, isTokenBlacklisted };
