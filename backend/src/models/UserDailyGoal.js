import mongoose from "mongoose";

const userDailyGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1, // 1 = Lunes
      max: 7, // 7 = Domingo
    },
    targetSeconds: {
      type: Number,
      required: true,
      default: 28800, // 8 horas por defecto
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Un usuario solo puede tener una meta por día de la semana
userDailyGoalSchema.index({ userId: 1, dayOfWeek: 1 }, { unique: true });

const UserDailyGoal = mongoose.model("UserDailyGoal", userDailyGoalSchema);

export default UserDailyGoal;
