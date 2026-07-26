import mongoose from "mongoose";

// 1st step: You need to create a schema
// 2nd step: You would create a model based off of that schema

const noteSchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Pendiente",
    },
    priority: {
      type: String,
      default: "Media",
    },
    user: {
      type: String,
      default: "Sin asignar",
    },
    labels: [
      {
        name: { type: String, required: true },
        color: { type: String, default: "#10B981" },
      },
    ],
    checklist: [
      {
        id: { type: String },
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    activities: [
      {
        id: { type: String },
        type: { type: String, default: "comment" }, // "comment" | "action"
        text: { type: String, required: true },
        user: { type: String, default: "Usuario" },
        createdAt: { type: Date, default: Date.now },
        parentId: { type: String, default: null },
        mentions: [{ type: String }],
        resolvedMentions: [{ type: String }],
      },
    ],
  },
  { timestamps: true } // createdAt, updatedAt
);

const Note = mongoose.model("Note", noteSchema);

export default Note;
