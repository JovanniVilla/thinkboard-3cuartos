import ProjectStatusConfig from "../models/ProjectStatusConfig.js";
import Project from "../models/Project.js";

export async function getProjectStatuses(req, res) {
  try {
    const statuses = await ProjectStatusConfig.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error fetching project statuses", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createProjectStatus(req, res) {
  try {
    const { name, color, category, order } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es obligatorio" });

    const newStatus = new ProjectStatusConfig({
      name: name.trim(),
      color: color || "#6B7280",
      category: category || "todo",
      order: order || 0,
    });
    
    const saved = await newStatus.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Este estado ya existe" });
    }
    console.error("Error creating project status", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProjectStatus(req, res) {
  try {
    const { name, color, category, order } = req.body;
    const statusObj = await ProjectStatusConfig.findById(req.params.id);
    if (!statusObj) return res.status(404).json({ message: "Estado no encontrado" });

    const oldName = statusObj.name;

    if (name !== undefined) statusObj.name = name.trim();
    if (color !== undefined) statusObj.color = color;
    if (category !== undefined) statusObj.category = category;
    if (order !== undefined) statusObj.order = order;

    const updated = await statusObj.save();

    // If the name changed, update all projects that had the old status name
    if (name !== undefined && name.trim() !== oldName) {
      await Project.updateMany(
        { status: oldName },
        { $set: { status: name.trim() } }
      );
    }

    res.status(200).json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Este estado ya existe" });
    }
    console.error("Error updating project status", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteProjectStatus(req, res) {
  try {
    const statusObj = await ProjectStatusConfig.findById(req.params.id);
    if (!statusObj) return res.status(404).json({ message: "Estado no encontrado" });

    const deletedName = statusObj.name;
    await ProjectStatusConfig.findByIdAndDelete(req.params.id);

    // Reassign projects that had the deleted status to the first available status
    const fallback = await ProjectStatusConfig.findOne().sort({ order: 1, createdAt: 1 });
    const fallbackName = fallback ? fallback.name : "En planeación";
    await Project.updateMany(
      { status: deletedName },
      { $set: { status: fallbackName } }
    );

    res.status(200).json({ message: "Estado eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting project status", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

