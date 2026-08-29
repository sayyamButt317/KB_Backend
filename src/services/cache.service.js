import crypto from "crypto";
import connectRedis from "../Config/redis.js";

const RAG_TTL = Number(process.env.CACHE_RAG_TTL_SECONDS || 300);
const CONV_TTL = Number(process.env.CACHE_CONV_TTL_SECONDS || 600);

function hashQuery(text) {
  return crypto.createHash("sha256").update(String(text).trim().toLowerCase()).digest("hex");
}

export async function getRagCache(companyId, query) {
  try {
    const key = `rag:${companyId}:${hashQuery(query)}`;
    const raw = await connectRedis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setRagCache(companyId, query, payload) {
  try {
    const key = `rag:${companyId}:${hashQuery(query)}`;
    await connectRedis.set(key, JSON.stringify(payload), "EX", RAG_TTL);
  } catch {
    /* cache optional */
    console.error("Error setting RAG cache");
  }
}

export async function getConversationCache(conversationId) {
  try {
    const raw = await connectRedis.get(`conv:${conversationId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setConversationCache(conversationId, payload) {
  try {
    await connectRedis.set(
      `conv:${conversationId}`,
      JSON.stringify(payload),
      "EX",
      CONV_TTL
    );
  } catch {
    /* cache optional */
    console.error("Error setting conversation cache");
  }
}

export async function invalidateConversationCache(conversationId) {
  try {
    await connectRedis.del(`conv:${conversationId}`);
  } catch {
    /* cache optional */
    console.error("Error invalidating conversation cache");
  }
}
