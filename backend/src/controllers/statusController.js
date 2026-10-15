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

// Ensure existing statuses with completion names are categorized as "done"
async function ensureDoneStatuses() {
  try {
    // 1. Update any status whose name clearly indicates completion
    await StatusConfig.updateMany(
      {
        name: { $regex: /^(completad|terminad|finalizad|listo|hecho|done|cerrad)/i },
        category: { $ne: "done" },
      },
      { $set: { category: "done" } }
    );

    // 2. If no status is marked as "done", ensure at least the last ordered status is "done"
    const hasDone = await StatusConfig.exists({ category: "done" });
    if (!hasDone) {
      const lastStatus = await StatusConfig.findOne().sort({ order: -1, createdAt: -1 });
      if (lastStatus) {
        lastStatus.category = "done";
        await lastStatus.save();
      }
    }
  } catch (err) {
    console.error("Error in ensureDoneStatuses", err);
  }
}

export async function getAllStatuses(_, res) {
  try {
    await seedDefaultStatuses();
    await ensureDoneStatuses();
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

    let finalCategory = category;
    if (!finalCategory || finalCategory === "todo") {
      if (/^(completad|terminad|finalizad|listo|hecho|done|cerrad)/i.test(name.trim())) {
        finalCategory = "done";
      } else if (/^(en progreso|en proceso|progreso|proceso|haciendo|in progress|working)/i.test(name.trim())) {
        finalCategory = "in_progress";
      } else {
        finalCategory = finalCategory || "todo";
      }
    }

    const status = new StatusConfig({
      name: name.trim(),
      color: color || "#6B7280",
      order: newOrder,
      category: finalCategory,
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
    const existing = await StatusConfig.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Estado no encontrado" });

    const oldName = existing.name;
    const newName = name ? name.trim() : existing.name;

    let finalCategory = category !== undefined ? category : existing.category;
    if (category === undefined && name && /^(completad|terminad|finalizad|listo|hecho|done|cerrad)/i.test(newName)) {
      finalCategory = "done";
    }

    existing.name = newName;
    if (color) existing.color = color;
    if (order !== undefined) existing.order = order;
    existing.category = finalCategory;

    const updated = await existing.save();

    // If the status name changed, migrate existing notes to the new status name
    if (name && oldName !== newName) {
      await Note.updateMany({ status: oldName }, { status: newName });
    }

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
