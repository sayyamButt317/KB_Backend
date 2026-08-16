import { Queue } from "bullmq";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// BullMQ queue for handle file uploads , will be processed by the worker.handle the processing of uploaded PDF files
const BullQueue = new Queue("file-upload-queue", {
  // Redis connection required for BullMQ to function
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
});

export default BullQueue;
