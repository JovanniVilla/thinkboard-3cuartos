import Project from "../models/Project.js";
import Note from "../models/Note.js";

export async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });
    
    const tasks = await Note.find({ project: project._id }).sort({ createdAt: -1 });
    
    res.status(200).json({ ...project.toObject(), tasks });
  } catch (error) {
    console.error("Error in getProjectById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllProjects(req, res) {
  try {
    const matchStage = {};
    if (req.user && req.user.role === "client") {
      if (req.user.assignedProjects && req.user.assignedProjects.length > 0) {
        matchStage._id = { $in: req.user.assignedProjects };
      } else {
        matchStage._id = { $in: [] };
      }
    }

    const projects = await Project.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "notes",
          localField: "_id",
          foreignField: "project",
          as: "projectNotes",
        },
      },
      {
        $addFields: {
          taskCount: { $size: "$projectNotes" },
          noteStatuses: "$projectNotes.status",
        },
      },
      {
        $project: {
          projectNotes: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error in getAllProjects controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createProject(req, res) {
  try {
    const { name, color, description, scope, acceptanceCriteria, projectType, startDate, endDate, objective, status, briefUrl, assignedTo, defaultAssignee, folderUrl, contact } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre del proyecto es obligatorio" });
    }

    const newProject = new Project({
      name: name.trim(),
      color: color || "#3B82F6",
      description: description || "",
      scope: scope || "",
      acceptanceCriteria: acceptanceCriteria || [],
      projectType: projectType || "General",
      startDate: startDate || null,
      endDate: endDate || null,
      objective: objective || "",
      status: status || "En planeación",
      briefUrl: briefUrl || "",
      assignedTo: assignedTo || "Sin asignar",
      defaultAssignee: defaultAssignee || "Sin asignar",
      folderUrl: folderUrl || "",
      contact: contact || {},
      activities: [],
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
    const { name, color, description, scope, acceptanceCriteria, projectType, startDate, endDate, objective, status, briefUrl, assignedTo, defaultAssignee, folderUrl, activities, contact } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    if (name !== undefined) project.name = name.trim();
    if (color !== undefined) project.color = color;
    if (description !== undefined) project.description = description;
    if (scope !== undefined) project.scope = scope;
    if (acceptanceCriteria !== undefined && Array.isArray(acceptanceCriteria)) project.acceptanceCriteria = acceptanceCriteria;
    if (projectType !== undefined) project.projectType = projectType;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (objective !== undefined) project.objective = objective;
    if (status !== undefined) project.status = status;
    if (briefUrl !== undefined) project.briefUrl = briefUrl;
    if (assignedTo !== undefined) project.assignedTo = assignedTo;
    if (defaultAssignee !== undefined) project.defaultAssignee = defaultAssignee;
    if (folderUrl !== undefined) project.folderUrl = folderUrl;
    if (activities !== undefined && Array.isArray(activities)) project.activities = activities;
    if (contact !== undefined) project.contact = { ...project.contact, ...contact };

    // Sanitize subdocument arrays — fix corrupt data already in DB (e.g., stored as "")
    if (!Array.isArray(project.acceptanceCriteria)) project.acceptanceCriteria = [];
    if (!Array.isArray(project.activities)) project.activities = [];

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
