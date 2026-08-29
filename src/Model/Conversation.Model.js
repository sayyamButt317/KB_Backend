import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "New Chat",
    },

    mode: {
      type: String,
      enum: ["auto", "knowledge", "ai", "hybrid"],
      default: "auto",
    },

    model: {
      type: String,
      default: "gpt-4o",
    },

    messageCount: {
      type: Number,
      default: 0,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    summary: {
      type: String,
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },

  { timestamps: true }
);

ConversationSchema.index({
  companyId: 1,
  userId: 1,
  lastMessageAt: -1,
});

ConversationSchema.index({
  companyId: 1,
  lastMessageAt: -1,
});

const ConversationModel = mongoose.model(
  "Conversation",
  ConversationSchema
);

export default ConversationModel;