import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true,
    },
    marker: {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
        default: null,
        index: true,
      },
      pageNumber: {
        type: Number,
        default: 1,
      },
      xPercent: {
        type: Number,
        min: 0,
        max: 100,
      },
      yPercent: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Subtask = mongoose.model("Subtask", subtaskSchema);

export default Subtask;
