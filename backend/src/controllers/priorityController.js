import PriorityConfig from "../models/PriorityConfig.js";
import Note from "../models/Note.js";

const DEFAULT_PRIORITIES = [
  { name: "Baja", color: "#10B981", order: 0 },
  { name: "Media", color: "#3B82F6", order: 1 },
  { name: "Alta", color: "#F97316", order: 2 },
  { name: "Urgente", color: "#EF4444", order: 3 },
];

async function seedDefaultPriorities() {
  const count = await PriorityConfig.countDocuments();
  if (count === 0) {
    await PriorityConfig.insertMany(DEFAULT_PRIORITIES);
  }
}

export async function getAllPriorities(_, res) {
  try {
    await seedDefaultPriorities();
    const priorities = await PriorityConfig.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(priorities);
  } catch (error) {
    console.error("Error in getAllPriorities controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createPriority(req, res) {
  try {
    const { name, color, order } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre de la prioridad es requerido" });
    }

    const maxOrder = await PriorityConfig.findOne().sort({ order: -1 });
    const newOrder = order ?? (maxOrder ? maxOrder.order + 1 : 0);

    const priority = new PriorityConfig({
      name: name.trim(),
      color: color || "#3B82F6",
      order: newOrder,
    });

    const saved = await priority.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error in createPriority controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updatePriority(req, res) {
  try {
    const { name, color, order } = req.body;
    const updated = await PriorityConfig.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name: name.trim() }), ...(color && { color }), ...(order !== undefined && { order }) },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Prioridad no encontrada" });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updatePriority controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deletePriority(req, res) {
  try {
    const deleted = await PriorityConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Prioridad no encontrada" });

    await Note.updateMany({ priority: deleted.name }, { priority: "Media" });

    res.status(200).json({ message: "Prioridad eliminada correctamente" });
  } catch (error) {
    console.error("Error in deletePriority controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
