import mongoose from "mongoose";

const MessageSourceSchema = new mongoose.Schema(
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

    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },

    chunkId: {
      type: String,
      default: null,
    },

    score: {
      type: Number,
      default: 0,
    },

    pageNumber: {
      type: Number,
      default: null,
    },

    content: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },

  { timestamps: true }
);

MessageSourceSchema.index({
  companyId: 1,
  messageId: 1,
});

const MessageSourceModel = mongoose.model(
  "MessageSource",
  MessageSourceSchema
);

export default MessageSourceModel;