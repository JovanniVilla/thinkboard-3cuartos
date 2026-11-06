import mongoose from "mongoose";

const timeEntryAuditSchema = new mongoose.Schema(
  {
    timeEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeEntry",
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousStartedAt: {
      type: Date,
      required: true,
    },
    previousEndedAt: {
      type: Date,
      default: null,
    },
    newStartedAt: {
      type: Date,
      required: true,
    },
    newEndedAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const TimeEntryAudit = mongoose.model("TimeEntryAudit", timeEntryAuditSchema);

export default TimeEntryAudit;
