import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please use a Valid Email Address"],
    },
    password: {
      type: String,
      required: [true,"Password is required"],
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;