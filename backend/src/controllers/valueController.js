import ValueConfig from "../models/ValueConfig.js";
import Note from "../models/Note.js";

const DEFAULT_VALUES = [
  { name: "Muy Alto", color: "#10B981", order: 0 },
  { name: "Alto", color: "#06B6D4", order: 1 },
  { name: "Medio", color: "#3B82F6", order: 2 },
  { name: "Bajo", color: "#6B7280", order: 3 },
];

async function seedDefaultValues() {
  const count = await ValueConfig.countDocuments();
  if (count === 0) {
    await ValueConfig.insertMany(DEFAULT_VALUES);
  }
}

export async function getAllValues(_, res) {
  try {
    await seedDefaultValues();
    const values = await ValueConfig.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(values);
  } catch (error) {
    console.error("Error in getAllValues controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createValue(req, res) {
  try {
    const { name, color, order } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre del valor es requerido" });
    }

    const maxOrder = await ValueConfig.findOne().sort({ order: -1 });
    const newOrder = order ?? (maxOrder ? maxOrder.order + 1 : 0);

    const valueDoc = new ValueConfig({
      name: name.trim(),
      color: color || "#3B82F6",
      order: newOrder,
    });

    const saved = await valueDoc.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error in createValue controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateValue(req, res) {
  try {
    const { name, color, order } = req.body;
    const existing = await ValueConfig.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Valor no encontrado" });

    const oldName = existing.name;
    const updated = await ValueConfig.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(color && { color }),
        ...(order !== undefined && { order }),
      },
      { new: true }
    );

    if (name && name.trim() !== oldName) {
      await Note.updateMany({ value: oldName }, { value: name.trim() });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateValue controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteValue(req, res) {
  try {
    const deleted = await ValueConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Valor no encontrado" });

    await Note.updateMany({ value: deleted.name }, { value: "Medio" });

    res.status(200).json({ message: "Valor eliminado correctamente" });
  } catch (error) {
    console.error("Error in deleteValue controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

