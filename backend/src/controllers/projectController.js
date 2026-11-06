import Project from "../models/Project.js";
import Note from "../models/Note.js";
import {
  generateActivityId,
  mergeProjectWithTaskActivities,
} from "../utils/projectActivity.js";

async function formatMergedProjectResponse(projectDoc, includeTasks = false) {
  const allProjectNotes = await Note.find({ project: projectDoc._id })
    .populate("size")
    .sort({ createdAt: -1 });

  const activeTasks = allProjectNotes.filter((n) => !n.archived);
  const merged = mergeProjectWithTaskActivities(
    projectDoc.toObject(),
    allProjectNotes
  );

  if (includeTasks) {
    return { ...merged, tasks: activeTasks };
  }
  return merged;
}

export async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const responseData = await formatMergedProjectResponse(project, true);
    res.status(200).json(responseData);
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
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$project", "$$projectId"] },
                archived: { $ne: true },
              },
            },
          ],
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
    const {
      name,
      color,
      description,
      scope,
      acceptanceCriteria,
      projectType,
      startDate,
      endDate,
      objective,
      status,
      isActive,
      projectKey,
      briefUrl,
      assignedTo,
      defaultAssignee,
      folderUrl,
      contact,
    } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ message: "El nombre del proyecto es obligatorio" });
    }

    const actor = req.user?.name || "Usuario";
    const initialStatus = status || "En planeación";

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
      status: initialStatus,
      isActive: isActive !== undefined ? isActive : true,
      projectKey: projectKey || "",
      briefUrl: briefUrl || "",
      assignedTo: assignedTo || "Sin asignar",
      defaultAssignee: defaultAssignee || "Sin asignar",
      folderUrl: folderUrl || "",
      contact: contact || {},
      activities: [
        {
          id: generateActivityId(),
          type: "project_action",
          text: `Creó el proyecto en estado "${initialStatus}"`,
          user: actor,
          createdAt: new Date(),
        },
      ],
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
    const {
      name,
      color,
      description,
      scope,
      acceptanceCriteria,
      projectType,
      startDate,
      endDate,
      objective,
      status,
      isActive,
      projectKey,
      briefUrl,
      assignedTo,
      defaultAssignee,
      folderUrl,
      activities,
      contact,
    } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    // Sanitize subdocument arrays before processing
    if (!Array.isArray(project.acceptanceCriteria)) project.acceptanceCriteria = [];
    if (!Array.isArray(project.activities)) project.activities = [];

    const actor = req.user?.name || "Usuario";
    const pushProjectAction = (text) => {
      project.activities.push({
        id: generateActivityId(),
        type: "project_action",
        text,
        user: actor,
        createdAt: new Date(),
      });
    };

    if (status !== undefined && status !== project.status) {
      pushProjectAction(
        `Cambió el estado del proyecto de "${project.status || "Sin estado"}" a "${status}"`
      );
      project.status = status;
    }

    if (isActive !== undefined && Boolean(isActive) !== Boolean(project.isActive)) {
      pushProjectAction(
        isActive ? "Marcó el proyecto como Activo" : "Marcó el proyecto como Inactivo"
      );
      project.isActive = isActive;
    }

    if (assignedTo !== undefined && assignedTo !== project.assignedTo) {
      if (assignedTo === "Sin asignar") {
        pushProjectAction(
          `Quitó a ${project.assignedTo} como responsable del proyecto`
        );
      } else {
        pushProjectAction(
          `Asignó a ${assignedTo} como responsable del proyecto`
        );
      }
      project.assignedTo = assignedTo;
    }

    if (acceptanceCriteria !== undefined && Array.isArray(acceptanceCriteria)) {
      const oldAC = project.acceptanceCriteria || [];
      const oldMap = new Map(oldAC.map((i) => [String(i.id), i]));
      const newMap = new Map(acceptanceCriteria.map((i) => [String(i.id), i]));

      if (oldAC.length > 1 && acceptanceCriteria.length === 0) {
        pushProjectAction(
          `Eliminó todos los criterios de aceptación (${oldAC.length})`
        );
      } else {
        for (const [key, item] of newMap.entries()) {
          if (!oldMap.has(key)) {
            pushProjectAction(`Agregó criterio de aceptación: "${item.title}"`);
          } else {
            const prev = oldMap.get(key);
            if (Boolean(prev.completed) !== Boolean(item.completed)) {
              pushProjectAction(
                item.completed
                  ? `Completó criterio de aceptación: "${item.title}"`
                  : `Reabrió criterio de aceptación: "${item.title}"`
              );
            }
          }
        }
        for (const [key, prev] of oldMap.entries()) {
          if (!newMap.has(key)) {
            pushProjectAction(`Eliminó criterio de aceptación: "${prev.title}"`);
          }
        }
      }

      project.acceptanceCriteria = acceptanceCriteria;
    }

    if (name !== undefined) project.name = name.trim();
    if (color !== undefined) project.color = color;
    if (description !== undefined) project.description = description;
    if (scope !== undefined) project.scope = scope;
    if (projectType !== undefined) project.projectType = projectType;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (objective !== undefined) project.objective = objective;

    if (projectKey !== undefined) {
      const oldKey = (project.projectKey || "").trim().toUpperCase();
      const newKey = projectKey.trim().toUpperCase();
      project.projectKey = newKey;

      if (newKey !== oldKey) {
        const prefix = newKey ? (newKey.endsWith("-") ? newKey : `${newKey}-`) : "";
        const projectNotes = await Note.find({ project: project._id }).sort({
          createdAt: 1,
        });
        let pCounter = project.taskCounter || 1;
        let isModified = false;

        for (const note of projectNotes) {
          if (newKey) {
            if (note.projectKeyId && note.projectKeyId.includes("-")) {
              const parts = note.projectKeyId.split("-");
              const num = parts[parts.length - 1];
              note.projectKeyId = `${prefix}${num}`;
            } else {
              note.projectKeyId = `${prefix}${pCounter}`;
              pCounter++;
              isModified = true;
            }
            note.keyId = note.projectKeyId;
          } else {
            note.projectKeyId = null;
            note.keyId = note.globalKeyId;
          }
          await note.save();
        }

        if (isModified) {
          project.taskCounter = pCounter;
        }
      }
    }

    if (briefUrl !== undefined) project.briefUrl = briefUrl;
    if (defaultAssignee !== undefined) project.defaultAssignee = defaultAssignee;
    if (folderUrl !== undefined) project.folderUrl = folderUrl;
    if (activities !== undefined && Array.isArray(activities)) {
      project.activities = activities;
    }
    if (contact !== undefined) project.contact = { ...project.contact, ...contact };

    const updatedProject = await project.save();
    const responseData = await formatMergedProjectResponse(updatedProject, false);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in updateProject controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function addProjectComment(req, res) {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res
        .status(400)
        .json({ message: "El texto del comentario es obligatorio" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    if (req.user?.role === "client") {
      const assigned = (req.user.assignedProjects || []).map((id) =>
        id.toString()
      );
      if (!assigned.includes(project._id.toString())) {
        return res.status(403).json({ message: "Acceso denegado a este proyecto" });
      }
    }

    if (!Array.isArray(project.activities)) project.activities = [];

    project.activities.push({
      id: generateActivityId(),
      type: "comment",
      text: text.trim(),
      user: req.user?.name || "Usuario",
      createdAt: new Date(),
    });

    const updatedProject = await project.save();
    const responseData = await formatMergedProjectResponse(updatedProject, false);
    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error in addProjectComment controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function editProjectComment(req, res) {
  try {
    const { text } = req.body;
    const { id, commentId } = req.params;

    if (!text?.trim()) {
      return res
        .status(400)
        .json({ message: "El texto del comentario es obligatorio" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    if (!Array.isArray(project.activities)) project.activities = [];

    const targetAct = project.activities.find(
      (act) =>
        act.type === "comment" &&
        (act.id === commentId || String(act._id) === commentId)
    );

    if (!targetAct) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }

    if (targetAct.user !== req.user?.name && req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar este comentario" });
    }

    targetAct.text = text.trim();
    targetAct.editedAt = new Date();

    const updatedProject = await project.save();
    const responseData = await formatMergedProjectResponse(updatedProject, false);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in editProjectComment controller", error);
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
