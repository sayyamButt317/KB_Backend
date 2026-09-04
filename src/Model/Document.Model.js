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

    // -------------------------
    // Knowledge Source
    // -------------------------

    sourceType: {
      type: String,
      enum: [
        "upload",
        "google_doc",
        "google_drive",
        "website",
      ],
      default: "upload",
      index: true,
    },

    sourceUrl: {
      type: String,
      default: null,
      trim: true,
    },

    externalId: {
      type: String,
      default: null,
      index: true,
    },

    // -------------------------
    // AI Modes
    // -------------------------

    modes: {
      type: [
        {
          type: String,
          enum: [
            "knowledge",
            "ai",
            "writer",
            "analyst",
            "researcher",
            "reviewer",
          ],
        },
      ],
      default: ["knowledge"],
    },

    // -------------------------
    // Storage
    // -------------------------

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

    // -------------------------
    // File Information
    // -------------------------

    mimeType: {
      type: String,
      default: null,
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },

    // -------------------------
    // Processing
    // -------------------------

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "ready",
        "failed",
      ],
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

    // -------------------------
    // Sync
    // -------------------------

    syncEnabled: {
      type: Boolean,
      default: false,
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },

    lastModifiedAt: {
      type: Date,
      default: null,
    },

    // -------------------------
    // Additional Metadata
    // -------------------------

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // -------------------------
    // Soft Delete
    // -------------------------

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// -------------------------
// Indexes
// -------------------------

DocumentSchema.index({
  companyId: 1,
  createdAt: -1,
});

DocumentSchema.index({
  companyId: 1,
  deletedAt: 1,
  createdAt: -1,
});

DocumentSchema.index({
  companyId: 1,
  status: 1,
  createdAt: -1,
});

DocumentSchema.index({
  companyId: 1,
  sourceType: 1,
  externalId: 1,
});

const DocumentModel = mongoose.model(
  "Document",
  DocumentSchema
);

export default DocumentModel;