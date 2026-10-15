import mongoose from "mongoose";

const videoNoteSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true, // e.g. '/uploads/videos/videonote-12345.webm'
    },
    filePath: {
      type: String, // Full path on disk for deletion
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "video/webm",
    },
    subtaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subtask",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const VideoNote = mongoose.model("VideoNote", videoNoteSchema);

export default VideoNote;
