import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME } = process.env;
if (!REDIS_HOST || !REDIS_PORT) {
  throw new Error("Missing REDIS_HOST or REDIS_PORT in environment variables");
}

const connectRedis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD || undefined,
  username: REDIS_USERNAME || undefined,
  db: 0,
  maxRetriesPerRequest: 3,
});

export default connectRedis;
