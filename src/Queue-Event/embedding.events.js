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

    const event = {
      status: payload?.status || "completed",
      result: payload?.result,
      message: payload?.message,
      jobId,
      companyId: payload?.companyId || null,
      documentId: payload?.documentId || null,
      documentIds: payload?.documentIds || [],
      chunks: payload?.chunks || 0,
    };

    io.emit(`job:${jobId}`, event);
    if (payload?.companyId) {
      io.to(`company:${payload.companyId}`).emit("embedding:completed", event);
    }
  });

  Events.on("failed", async ({ jobId, failedReason }) => {
    io.emit(`job:${jobId}`, {
      status: "failed",
      error: failedReason,
      jobId,
    });
  });
};

export default registerEmbeddingEvents;
