import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant", "system", "tool"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    model: {
      type: String,
      default: null,
    },

    inputTokens: {
      type: Number,
      default: 0,
    },

    outputTokens: {
      type: Number,
      default: 0,
    },

    responseTimeMs: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

MessageSchema.index({
  companyId: 1,
  conversationId: 1,
  createdAt: 1,
});

MessageSchema.index({
  companyId: 1,
  userId: 1,
  createdAt: -1,
});

const MessageModel = mongoose.model("Message", MessageSchema);

export default MessageModel;