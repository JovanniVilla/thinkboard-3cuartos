import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true, // e.g. '/uploads/filename.ext'
    },
    filePath: {
      type: String, // Full path on disk for deletion
    },
    size: {
      type: Number,
      default: 0, // In bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model("File", fileSchema);

export default File;
