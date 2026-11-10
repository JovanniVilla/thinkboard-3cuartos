import mongoose from "mongoose";

const valueConfigSchema = new mongoose.Schema(
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

const ValueConfig = mongoose.model("ValueConfig", valueConfigSchema);

export default ValueConfig;

