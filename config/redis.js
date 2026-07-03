import { Redis } from 'ioredis';

let redisClient = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('Redis connection failed, continuing without cache');
        return null;
      }
      return Math.min(times * 50, 2000);
    }
  });

  redisClient.on('connect', () => {
    console.log('Redis Connected');
  });

  redisClient.on('error', (err) => {
    console.warn('Redis Client Error:', err.message);
  });
} else {
  console.warn('REDIS_URL not set, continuing without cache');
}

export default redisClient;
