import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });
const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;

if (!REDIS_USERNAME || !REDIS_PASSWORD || !REDIS_HOST || !REDIS_PORT) {
  throw new Error("Missing Redis configuration in environment variables");
}

// Create a Redis client
const connectRedis = new Redis({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

export default connectRedis;
