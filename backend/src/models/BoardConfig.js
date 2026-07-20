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
  },
  { timestamps: true }
);

const BoardConfig = mongoose.model("BoardConfig", boardConfigSchema);

export default BoardConfig;
