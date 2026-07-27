import mongoose from "mongoose";

const statusConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      default: "#6B7280",
    },
    category: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const StatusConfig = mongoose.model("StatusConfig", statusConfigSchema);

export default StatusConfig;
