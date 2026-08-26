import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    description: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
    acceptanceCriteria: {
      type: String,
      default: "",
    },
    projectType: {
      type: String,
      default: "General",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    objective: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "En planeación",
    },
    briefUrl: {
      type: String,
      default: "",
    },
    assignedTo: {
      type: String,
      default: "Sin asignar",
    },
    defaultAssignee: {
      type: String,
      default: "Sin asignar",
    },
    folderUrl: {
      type: String,
      default: "",
    },
    contact: {
      name: { type: String, default: "" },
      position: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" }
    },
    activities: [
      {
        id: { type: String },
        type: { type: String, default: "comment" },
        text: { type: String, required: true },
        user: { type: String, default: "Usuario" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
