import { QueueEvents } from "bullmq";
import { verifyAccessToken } from "../Utils/jwt.js";

let ioRef = null;

export function getIo() {
  return ioRef;
}

/** Emit document upload/embedding status to job + company + document rooms */
export function emitDocumentStatus(payload) {
  if (!ioRef) return;

  const event = {
    type: "document:status",
    jobId: payload.jobId,
    documentId: payload.documentId ?? null,
    documentIds: payload.documentIds ?? [],
    companyId: payload.companyId,
    status: payload.status,
    progress: payload.progress ?? null,
    message: payload.message ?? null,
    chunks: payload.chunks ?? null,
    error: payload.error ?? null,
    filename: payload.filename ?? null,
    timestamp: new Date().toISOString(),
  };

  if (payload.jobId) {
    ioRef.to(`job:${payload.jobId}`).emit("document:status", event);
  }
  if (payload.documentId) {
    ioRef.to(`document:${payload.documentId}`).emit("document:status", event);
  }
  if (payload.companyId) {
    ioRef.to(`company:${payload.companyId}`).emit("document:status", event);
  }
}

function parseQueuePayload(returnvalue) {
  if (!returnvalue) return {};
  if (typeof returnvalue === "string") {
    try {
      return JSON.parse(returnvalue);
    } catch {
      return {};
    }
  }
  return returnvalue;
}

function registerQueueEvents(io) {
  const events = new QueueEvents("file-upload-queue", {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    },
  });

  events.on("waiting", ({ jobId }) => {
    emitDocumentStatus({
      jobId,
      status: "pending",
      progress: 0,
      message: "Queued for processing",
    });
  });

  events.on("active", ({ jobId }) => {
    emitDocumentStatus({
      jobId,
      status: "processing",
      progress: 10,
      message: "Worker started processing",
    });
  });

  events.on("progress", ({ jobId, data }) => {
    const progress =
      typeof data === "object" ? data.progress : Number(data) || 0;

    emitDocumentStatus({
      jobId,
      documentId: data?.documentId ?? null,
      companyId: data?.companyId ?? null,
      status: data?.status || "processing",
      progress,
      message: data?.message ?? "Processing document",
      filename: data?.filename ?? null,
    });
  });

  events.on("completed", ({ jobId, returnvalue }) => {
    const payload = parseQueuePayload(returnvalue);

    emitDocumentStatus({
      jobId,
      companyId: payload.companyId,
      documentId: payload.documentId,
      documentIds: payload.documentIds || [],
      status: payload.status === "failed" ? "failed" : "ready",
      progress: 100,
      message: payload.message || "Vectorization complete",
      chunks: payload.chunks ?? 0,
      error: payload.error ?? null,
    });
  });

  events.on("failed", ({ jobId, failedReason }) => {
    emitDocumentStatus({
      jobId,
      status: "failed",
      progress: 100,
      message: "Vectorization failed",
      error: failedReason,
    });
  });

  return events;
}

/**
 * Register Socket.io handlers for real-time document upload tracking.
 * Client connects with auth.token = JWT access token.
 */
export default function registerWebSocket(io) {
  ioRef = io;

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyAccessToken(token);
      socket.user = {
        id: String(payload.sub),
        companyId: String(payload.companyId),
        role: payload.role || "user",
      };
      return next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { companyId, id: userId } = socket.user;
    socket.join(`company:${companyId}`);
    socket.join(`user:${userId}`);

    console.log(`WebSocket connected: user=${userId} company=${companyId}`);

    /** Subscribe to a specific upload job */
    socket.on("join:job", ({ jobId }) => {
      if (!jobId) return;
      socket.join(`job:${jobId}`);
      socket.emit("document:status", {
        type: "document:subscribed",
        jobId,
        message: `Subscribed to job ${jobId}`,
        timestamp: new Date().toISOString(),
      });
    });

    /** Subscribe to a specific document */
    socket.on("join:document", ({ documentId }) => {
      if (!documentId) return;
      socket.join(`document:${documentId}`);
      socket.emit("document:status", {
        type: "document:subscribed",
        documentId,
        message: `Subscribed to document ${documentId}`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`WebSocket disconnected: user=${userId}`);
    });
  });

  registerQueueEvents(io);
  console.log("WebSocket document tracking enabled (Socket.io)");
}
