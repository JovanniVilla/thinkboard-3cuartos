import mongoose from "mongoose";

const boardConfigSchema = new mongoose.Schema(
  {
    projectKey: {
      type: String,
      trim: true,
      default: "",
    },
    taskCounter: {
      type: Number,
      default: 1,
    },
    driveFolderLink: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const BoardConfig = mongoose.model("BoardConfig", boardConfigSchema);

export default BoardConfig;
