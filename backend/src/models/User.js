import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    role: {
      type: String,
      enum: ["client", "team", "admin"],
      default: "client",
    },
    assignedProjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    }],
    isApproved: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    jobTitle: {
      type: String,
      default: "",
    },
    requiresPasswordChange: {
      type: Boolean,
      default: false,
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Capture previous name so assignments can be migrated after a rename
userSchema.pre("save", async function (next) {
  if (!this.isNew && this.isModified("name")) {
    const previous = await this.constructor.findById(this._id).select("name").lean();
    this._previousName = previous?.name;
  }
  next();
});

// Propagate renames to tasks/projects that reference the user by name
userSchema.post("save", async function (doc) {
  const oldName = doc._previousName;
  if (!oldName || oldName === doc.name) return;
  doc._previousName = undefined;
  try {
    await Promise.all([
      mongoose.model("Note").updateMany({ user: oldName }, { $set: { user: doc.name } }),
      mongoose.model("Project").updateMany(
        { defaultAssignee: oldName },
        { $set: { defaultAssignee: doc.name } }
      ),
    ]);
  } catch (error) {
    console.error("Error propagating user rename", error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
