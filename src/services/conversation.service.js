import ConversationModel from "../Model/Conversation.Model.js";
import MessageModel from "../Model/Message.Model.js";
import MessageSourceModel from "../Model/MessageSource.Model.js";
import {
  getConversationCache,
  setConversationCache,
  invalidateConversationCache,
} from "./cache.service.js";

export async function createConversation({
  companyId,
  userId,
  title = "New Chat",
  mode = "knowledge",
}) {
  return ConversationModel.create({
    companyId,
    userId,
    title,
    mode,
    messageCount: 0,
    lastMessageAt: new Date(),
  });
}

export async function listConversations({ companyId, userId, limit = 50 }) {
  return ConversationModel.find({ companyId, userId, deletedAt: null })
    .sort({ lastMessageAt: -1 })
    .limit(Math.min(limit, 200))
    .lean();
}

export async function getConversationWithMessages(id, companyId) {
  const cached = await getConversationCache(id);
  if (cached && String(cached.companyId) === String(companyId)) {
    return cached;
  }

  const conversation = await ConversationModel.findOne({
    _id: id,
    companyId,
    deletedAt: null,
  }).lean();

  if (!conversation) return null;

  const messages = await MessageModel.find({ conversationId: id, companyId })
    .sort({ createdAt: 1 })
    .lean();

  const messageIds = messages.map((m) => m._id);
  const sources = await MessageSourceModel.find({
    messageId: { $in: messageIds },
    companyId,
  }).lean();

  const sourcesByMessage = sources.reduce((acc, src) => {
    const key = String(src.messageId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(src);
    return acc;
  }, {});

  const payload = {
    ...conversation,
    messages: messages.map((m) => ({
      ...m,
      sources: sourcesByMessage[String(m._id)] || [],
    })),
  };

  await setConversationCache(id, payload);
  return payload;
}

export async function appendUserMessage({
  conversationId,
  companyId,
  userId,
  content,
}) {
  return MessageModel.create({
    conversationId,
    companyId,
    userId,
    role: "user",
    content,
  });
}

export async function appendAssistantMessage({
  conversationId,
  companyId,
  userId,
  content,
  model,
  inputTokens = 0,
  outputTokens = 0,
  responseTimeMs = 0,
}) {
  return MessageModel.create({
    conversationId,
    companyId,
    userId,
    role: "assistant",
    content,
    model,
    inputTokens,
    outputTokens,
    responseTimeMs,
  });
}

export async function saveMessageSources({
  messageId,
  conversationId,
  companyId,
  sources,
}) {
  if (!sources?.length) return [];

  const rows = sources.map((src) => ({
    messageId,
    conversationId,
    companyId,
    documentId: src.documentId || null,
    chunkId: src.chunkId || null,
    score: src.score ?? 0,
    pageNumber: src.pageNumber ?? null,
    content: src.content || null,
    metadata: src.metadata || {},
  }));

  return MessageSourceModel.insertMany(rows);
}

export async function bumpConversation(conversationId, companyId, increment = 2) {
  await ConversationModel.findOneAndUpdate(
    { _id: conversationId, companyId },
    {
      $inc: { messageCount: increment },
      $set: { lastMessageAt: new Date() },
    }
  );
  await invalidateConversationCache(conversationId);
}

export async function assertConversationAccess(conversationId, companyId, userId) {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    companyId,
    deletedAt: null,
  });

  if (!conversation) return null;
  if (String(conversation.userId) !== String(userId)) {
    return { forbidden: true };
  }
  return conversation;
}

export async function deleteConversation(conversationId, companyId, userId, role) {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    companyId,
    deletedAt: null,
  });

  if (!conversation) return { notFound: true };

  const isOwner = String(conversation.userId) === String(userId);
  const isAdmin = role === "admin" || role === "superadmin";

  if (!isOwner && !isAdmin) {
    return { forbidden: true };
  }

  conversation.deletedAt = new Date();
  await conversation.save();
  await invalidateConversationCache(conversationId);

  return { conversation };
}
