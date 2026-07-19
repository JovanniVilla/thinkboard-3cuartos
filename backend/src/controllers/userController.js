import UserConfig from "../models/UserConfig.js";
import Note from "../models/Note.js";

const DEFAULT_USERS = [
  { name: "Ana García", email: "ana@agencia.dev", color: "#EC4899", role: "Diseñadora UX/UI" },
  { name: "Carlos López", email: "carlos@agencia.dev", color: "#3B82F6", role: "Desarrollador Fullstack" },
  { name: "Jovanni Villa", email: "jovanni@agencia.dev", color: "#10B981", role: "Tech Lead / PM" },
];

async function seedDefaultUsers() {
  const count = await UserConfig.countDocuments();
  if (count === 0) {
    await UserConfig.insertMany(DEFAULT_USERS);
  }
}

export async function getAllUsers(_, res) {
  try {
    await seedDefaultUsers();
    const users = await UserConfig.find().sort({ name: 1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getAllUsers controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, color, role } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre del usuario es requerido" });
    }

    const user = new UserConfig({
      name: name.trim(),
      email: email?.trim() || "",
      color: color || "#3B82F6",
      role: role?.trim() || "Miembro del equipo",
    });

    const saved = await user.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error in createUser controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUser(req, res) {
  try {
    const { name, email, color, role } = req.body;
    const updated = await UserConfig.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(color && { color }),
        ...(role !== undefined && { role: role.trim() }),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateUser controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUser(req, res) {
  try {
    const deleted = await UserConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Usuario no encontrado" });

    await Note.updateMany({ user: deleted.name }, { user: "Sin asignar" });

    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error in deleteUser controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
