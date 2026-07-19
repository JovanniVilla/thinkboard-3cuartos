import mongoose from "mongoose";

const priorityConfigSchema = new mongoose.Schema(
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
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const PriorityConfig = mongoose.model("PriorityConfig", priorityConfigSchema);

export default PriorityConfig;
