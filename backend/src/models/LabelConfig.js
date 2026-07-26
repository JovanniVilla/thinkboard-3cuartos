import mongoose from "mongoose";

const labelConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      default: "#3B82F6",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const LabelConfig = mongoose.model("LabelConfig", labelConfigSchema);

export default LabelConfig;
