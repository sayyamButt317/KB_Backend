import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    docs: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

ChatSchema.index({ companyId: 1, createdAt: -1 });
ChatSchema.index({ companyId: 1, userId: 1, createdAt: -1 });

const ChatModel = mongoose.model("Chat", ChatSchema);
export default ChatModel;
