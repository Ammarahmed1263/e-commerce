import redisClient from '../config/redis.js';

export const get = async (key) => {
  try {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

export const set = async (key, value, ttlSeconds) => {
  try {
    if (!redisClient) return;
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
  }
};

export const del = async (key) => {
  try {
    if (!redisClient) return;
    await redisClient.del(key);
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
  }
};

export const delPattern = async (pattern) => {
  try {
    if (!redisClient) return;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error(`Redis DEL PATTERN error for pattern ${pattern}:`, error);
  }
};
