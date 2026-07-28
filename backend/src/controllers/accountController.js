import User from "../models/User.js";

/**
 * GET /api/accounts
 * List all user accounts (admin only).
 */
export async function getAllAccounts(req, res) {
  try {
    const accounts = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error in getAllAccounts controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PUT /api/accounts/:id/approve
 * Approve a pending user account (admin only).
 */
export async function approveAccount(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: "Esta cuenta ya está aprobada" });
    }

    user.isApproved = true;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in approveAccount controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PUT /api/accounts/:id/reject
 * Reject (un-approve) a user account (admin only).
 */
export async function rejectAccount(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }

    // Prevent admin from rejecting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "No puedes revocar tu propia cuenta" });
    }

    user.isApproved = false;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in rejectAccount controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PUT /api/accounts/:id/role
 * Change user role (admin only).
 */
export async function changeRole(req, res) {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rol inválido. Debe ser 'user' o 'admin'" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({ message: "No puedes cambiar tu propio rol" });
    }

    user.role = role;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in changeRole controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * DELETE /api/accounts/:id
 * Delete a user account (admin only).
 */
export async function deleteAccount(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    console.error("Error in deleteAccount controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PUT /api/accounts/:id/reset-password
 * Admin generates a temporary password for the user.
 */
export async function resetUserPassword(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }

    // Generate random 8-character password
    const newPassword = Math.random().toString(36).slice(-8);

    // Save and flag requires password change
    user.password = newPassword;
    user.requiresPasswordChange = true;
    await user.save(); // Pre-save hook will hash the password

    res.status(200).json({ 
      message: "Contraseña restablecida correctamente", 
      temporaryPassword: newPassword 
    });
  } catch (error) {
    console.error("Error in resetUserPassword controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
