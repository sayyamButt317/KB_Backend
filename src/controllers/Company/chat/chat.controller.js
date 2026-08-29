import {
  createConversation,
  listConversations,
  getConversationWithMessages,
  appendUserMessage,
  appendAssistantMessage,
  saveMessageSources,
  bumpConversation,
  assertConversationAccess,
  deleteConversation,
} from "../../../services/conversation.service.js";
import { runRagQuery } from "../../../services/rag.service.js";

export async function CreateConversation(req, res) {
  try {
    const { title, mode } = req.body;
    const conversation = await createConversation({
      companyId: req.user.companyId,
      userId: req.user.id,
      title: title || "New Chat",
      mode: mode || "knowledge",
    });

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function ListConversations(req, res) {
  try {
    const conversations = await listConversations({
      companyId: req.user.companyId,
      userId: req.user.id,
      limit: Number(req.query.limit) || 50,
    });

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function GetConversation(req, res) {
  try {
    const data = await getConversationWithMessages(
      req.params.id,
      req.user.companyId
    );

    if (!data) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (String(data.userId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({ success: true, conversation: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function SendMessage(req, res) {
  try {
    const { content, mode } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "content is required" });
    }

    const access = await assertConversationAccess(
      req.params.id,
      req.user.companyId,
      req.user.id
    );

    if (!access) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    if (access.forbidden) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (mode && access.mode !== mode) {
      access.mode = mode;
      await access.save();
    }

    const userMessage = await appendUserMessage({
      conversationId: access._id,
      companyId: req.user.companyId,
      userId: req.user.id,
      content: content.trim(),
    });

    const rag = await runRagQuery({
      companyId: req.user.companyId,
      query: content.trim(),
    });

    const assistantMessage = await appendAssistantMessage({
      conversationId: access._id,
      companyId: req.user.companyId,
      userId: req.user.id,
      content: rag.content,
      model: rag.model,
      inputTokens: rag.inputTokens,
      outputTokens: rag.outputTokens,
      responseTimeMs: rag.responseTimeMs,
    });

    const sources = await saveMessageSources({
      messageId: assistantMessage._id,
      conversationId: access._id,
      companyId: req.user.companyId,
      sources: rag.sources,
    });

    await bumpConversation(access._id, req.user.companyId, 2);

    const conversation = await getConversationWithMessages(
      access._id,
      req.user.companyId
    );

    return res.status(200).json({
      success: true,
      conversation: {
        _id: conversation._id,
        companyId: conversation.companyId,
        userId: conversation.userId,
        title: conversation.title,
        mode: conversation.mode,
        messageCount: conversation.messageCount,
        lastMessageAt: conversation.lastMessageAt,
      },
      userMessage,
      assistantMessage,
      sources,
      fromCache: rag.fromCache || false,
    });
  } catch (error) {
    console.error("❌ SendMessage error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function DeleteConversation(req, res) {
  try {
    const result = await deleteConversation(
      req.params.id,
      req.user.companyId,
      req.user.id,
      req.user.role
    );

    if (result.notFound) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation deleted",
      conversationId: result.conversation._id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
