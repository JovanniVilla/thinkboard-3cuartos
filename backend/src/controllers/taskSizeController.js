import TaskSizeConfig from "../models/TaskSizeConfig.js";

const DEFAULT_SIZES = [
  { name: "XS", value: 0.5, points: 1, color: "#10B981", order: 0 },
  { name: "S", value: 1, points: 2, color: "#3B82F6", order: 1 },
  { name: "M", value: 2, points: 3, color: "#F59E0B", order: 2 },
  { name: "L", value: 4, points: 5, color: "#F97316", order: 3 },
  { name: "XL", value: 8, points: 8, color: "#EF4444", order: 4 },
  { name: "XXL", value: 16, points: 13, color: "#8B5CF6", order: 5 },
];

export const getTaskSizes = async (req, res) => {
  try {
    let sizes = await TaskSizeConfig.find().sort({ order: 1 });
    
    // Seed if empty
    if (sizes.length === 0) {
      sizes = await TaskSizeConfig.insertMany(DEFAULT_SIZES);
    }
    
    res.status(200).json(sizes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los tamaños de tareas" });
  }
};

export const createTaskSize = async (req, res) => {
  const { name, value, points, color, order } = req.body;

  try {
    const newSize = new TaskSizeConfig({ name, value, points, color, order });
    await newSize.save();
    res.status(201).json(newSize);
  } catch (error) {
    res.status(400).json({ message: "Error al crear tamaño de tarea" });
  }
};

export const updateTaskSize = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedSize = await TaskSizeConfig.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedSize) return res.status(404).json({ message: "Tamaño no encontrado" });
    res.status(200).json(updatedSize);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar tamaño" });
  }
};

export const deleteTaskSize = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSize = await TaskSizeConfig.findByIdAndDelete(id);
    if (!deletedSize) return res.status(404).json({ message: "Tamaño no encontrado" });
    res.status(200).json({ message: "Tamaño eliminado correctamente" });
  } catch (error) {
    res.status(400).json({ message: "Error al eliminar tamaño" });
  }
};
