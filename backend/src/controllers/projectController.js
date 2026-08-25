import Project from "../models/Project.js";

export async function getAllProjects(req, res) {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error in getAllProjects controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createProject(req, res) {
  try {
    const { name, color, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre del proyecto es obligatorio" });
    }

    const newProject = new Project({
      name: name.trim(),
      color: color || "#3B82F6",
      description: description || "",
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    console.error("Error in createProject controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProject(req, res) {
  try {
    const { name, color, description } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    if (name) project.name = name.trim();
    if (color) project.color = color;
    if (description !== undefined) project.description = description;

    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error in updateProject controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    console.error("Error in deleteProject controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
