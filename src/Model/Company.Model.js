import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "trial", "cancelled"],
      default: "trial",
      index: true,
    },

    plan: {
      type: String,
      enum: ["free", "pro", "business", "enterprise"],
      default: "free",
    },
  },
  { timestamps: true }
);

const CompanyModel = mongoose.model("Company", CompanySchema);

export default CompanyModel;