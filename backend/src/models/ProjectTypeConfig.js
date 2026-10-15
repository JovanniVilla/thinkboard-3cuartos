import mongoose from "mongoose";

const projectTypeConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const ProjectTypeConfig = mongoose.model("ProjectTypeConfig", projectTypeConfigSchema);

export default ProjectTypeConfig;
