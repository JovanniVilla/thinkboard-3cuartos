import mongoose from "mongoose";

const projectStatusConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    color: {
      type: String,
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

const ProjectStatusConfig = mongoose.model("ProjectStatusConfig", projectStatusConfigSchema);

export default ProjectStatusConfig;
