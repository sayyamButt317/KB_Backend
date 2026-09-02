import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
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
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      default: null,
      select: false,
    },
    s3Key: {
      type: String,
      default: null,
      select: false,
      index: true,
    },
    storage: {
      type: String,
      enum: ["local", "s3"],
      default: "local",
      index: true,
    },
    mimeType: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "ready", "failed"],
      default: "pending",
      index: true,
    },
    jobId: {
      type: String,
      default: null,
      index: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

DocumentSchema.index({ companyId: 1, createdAt: -1 });
DocumentSchema.index({ companyId: 1, deletedAt: 1, createdAt: -1 });
DocumentSchema.index({ companyId: 1, status: 1, createdAt: -1 });

const DocumentModel = mongoose.model("Document", DocumentSchema);
export default DocumentModel;
