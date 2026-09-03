import mongoose from "mongoose";

const taskSizeConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      default: 0, // En horas
    },
    points: {
      type: Number,
      default: 1, // Puntos Fibonacci
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const TaskSizeConfig = mongoose.model("TaskSizeConfig", taskSizeConfigSchema);

export default TaskSizeConfig;
