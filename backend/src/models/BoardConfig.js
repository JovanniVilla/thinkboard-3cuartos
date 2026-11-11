import mongoose from "mongoose";

const boardConfigSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      trim: true,
      default: "ThinkBoard",
      maxlength: 25,
    },
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
    enableFileUploads: {
      type: Boolean,
      default: true,
    },
    enableVideoNotes: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const BoardConfig = mongoose.model("BoardConfig", boardConfigSchema);

export default BoardConfig;
