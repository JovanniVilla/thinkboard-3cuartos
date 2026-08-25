import ProjectTypeConfig from "../models/ProjectTypeConfig.js";

export async function getProjectTypes(req, res) {
  try {
    const types = await ProjectTypeConfig.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(types);
  } catch (error) {
    console.error("Error fetching project types", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createProjectType(req, res) {
  try {
    const { name, color, order } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es obligatorio" });

    const newType = new ProjectTypeConfig({
      name: name.trim(),
      color: color || "#3B82F6",
      order: order || 0,
    });
    
    const saved = await newType.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Este tipo ya existe" });
    }
    console.error("Error creating project type", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProjectType(req, res) {
  try {
    const { name, color, order } = req.body;
    const typeObj = await ProjectTypeConfig.findById(req.params.id);
    if (!typeObj) return res.status(404).json({ message: "Tipo no encontrado" });

    if (name !== undefined) typeObj.name = name.trim();
    if (color !== undefined) typeObj.color = color;
    if (order !== undefined) typeObj.order = order;

    const updated = await typeObj.save();
    res.status(200).json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Este tipo ya existe" });
    }
    console.error("Error updating project type", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteProjectType(req, res) {
  try {
    const typeObj = await ProjectTypeConfig.findById(req.params.id);
    if (!typeObj) return res.status(404).json({ message: "Tipo no encontrado" });
    
    await ProjectTypeConfig.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Tipo eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting project type", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
