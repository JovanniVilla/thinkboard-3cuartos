import mongoose from "mongoose";

const timeEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["GLOBAL", "NOTE"],
      required: true,
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    lastPingAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["RUNNING", "PAUSED", "CLOSED_BY_TIMEOUT", "EDITED"],
      default: "RUNNING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries
timeEntrySchema.index({ userId: 1, status: 1, type: 1 });
timeEntrySchema.index({ userId: 1, startedAt: 1, endedAt: 1 });
timeEntrySchema.index({ noteId: 1, status: 1 });

const TimeEntry = mongoose.model("TimeEntry", timeEntrySchema);

export default TimeEntry;
