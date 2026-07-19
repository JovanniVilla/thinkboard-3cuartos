import mongoose from "mongoose";

const userConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      required: true,
      default: "#3B82F6",
    },
    role: {
      type: String,
      trim: true,
      default: "Miembro del equipo",
    },
  },
  { timestamps: true }
);

const UserConfig = mongoose.model("UserConfig", userConfigSchema);

export default UserConfig;
