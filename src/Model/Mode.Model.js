import mongoose from "mongoose";

const ModeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    icon: {
      type: String,
      default: "🤖",
    },

    // AI behavior/instructions
    systemPrompt: {
      type: String,
      default: "",
    },

    // Whether this mode can use company knowledge
    useKnowledge: {
      type: Boolean,
      default: true,
    },

    // Tools/capabilities available to this mode
    tools: {
      type: [
        {
          type: String,
          enum: [
            "searchKnowledge",
            "webSearch",
            "analyzeData",
            "analyzeDocument",
            "summarize",
            "writeContent",
            "searchCustomers",
            "searchLeads",
            "createLead",
            "updateLead",
            "createAppointment",
            "cancelAppointment",
            "rescheduleAppointment",
          ],
        },
      ],
      default: ["searchKnowledge"],
    },

    // Response behavior
    tone: {
      type: String,
      enum: [
        "professional",
        "friendly",
        "concise",
        "detailed",
        "formal",
        "casual",
      ],
      default: "professional",
    },

    responseFormat: {
      type: String,
      enum: [
        "natural",
        "bullet_points",
        "structured",
        "step_by_step",
        "table",
      ],
      default: "natural",
    },

    responseLength: {
      type: String,
      enum: ["short", "medium", "long"],
      default: "medium",
    },

    // Which knowledge this mode can access
    knowledge: {
      scope: {
        type: String,
        enum: ["all", "selected"],
        default: "all",
      },

      documents: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document",
        },
      ],

      folders: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Folder",
        },
      ],
    },

    // System modes cannot be deleted by normal users
    isSystem: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ModeSchema.index({
  companyId: 1,
  slug: 1,
});

ModeSchema.index({
  companyId: 1,
  isActive: 1,
});

const ModeModel = mongoose.model("Mode", ModeSchema);

export default ModeModel;