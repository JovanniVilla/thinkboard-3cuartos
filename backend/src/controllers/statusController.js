import StatusConfig from "../models/StatusConfig.js";
import Note from "../models/Note.js";

const DEFAULT_STATUSES = [
  { name: "Pendiente", color: "#6B7280", order: 0, category: "todo" },
  { name: "En Progreso", color: "#3B82F6", order: 1, category: "in_progress" },
  { name: "Completado", color: "#10B981", order: 2, category: "done" },
];

// Seed defaults if none exist
async function seedDefaultStatuses() {
  const count = await StatusConfig.countDocuments();
  if (count === 0) {
    await StatusConfig.insertMany(DEFAULT_STATUSES);
  }
}

export async function getAllStatuses(_, res) {
  try {
    await seedDefaultStatuses();
    const statuses = await StatusConfig.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error in getAllStatuses controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createStatus(req, res) {
  try {
    const { name, color, order, category } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre del estado es requerido" });
    }

    const maxOrder = await StatusConfig.findOne().sort({ order: -1 });
    const newOrder = order ?? (maxOrder ? maxOrder.order + 1 : 0);

    const status = new StatusConfig({
      name: name.trim(),
      color: color || "#6B7280",
      order: newOrder,
      category: category || "todo",
    });

    const saved = await status.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error in createStatus controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateStatus(req, res) {
  try {
    const { name, color, order, category } = req.body;
    const updated = await StatusConfig.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name: name.trim() }), ...(color && { color }), ...(order !== undefined && { order }), ...(category && { category }) },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Estado no encontrado" });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateStatus controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteStatus(req, res) {
  try {
    const deleted = await StatusConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Estado no encontrado" });

    // Reset notes that had this status to "Pendiente"
    await Note.updateMany({ status: deleted.name }, { status: "Pendiente" });

    res.status(200).json({ message: "Estado eliminado correctamente" });
  } catch (error) {
    console.error("Error in deleteStatus controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
