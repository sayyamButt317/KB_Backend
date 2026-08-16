import { QueueEvents } from "bullmq";

const registerEmbeddingEvents = (io) => {
  const Events = new QueueEvents("file-upload-queue", {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    },
  });

  Events.on("completed", async ({ jobId, returnvalue }) => {
    let payload = returnvalue;
    if (typeof payload === "string") payload = JSON.parse(payload);
    io.emit(`job:${jobId}`, {
      status: payload?.status || "completed",
      result: payload?.result,
      message: payload?.message,
    });
  });

  Events.on("failed", async ({ jobId, failedReason }) => {
    io.emit(`job:${jobId}`, {
      status: "failed",
      error: failedReason,
    });
  });
};

export default registerEmbeddingEvents;
