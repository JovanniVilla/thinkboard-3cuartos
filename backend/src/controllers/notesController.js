import Note from "../models/Note.js";
import BoardConfig from "../models/BoardConfig.js";
import StatusConfig from "../models/StatusConfig.js";
import Project from "../models/Project.js";

export async function getAllNotes(req, res) {
  try {
    const filter = { archived: { $ne: true } };
    
    if (req.user && req.user.role === "client") {
      if (req.user.assignedProjects && req.user.assignedProjects.length > 0) {
        filter.project = { $in: req.user.assignedProjects };
      } else {
        filter.project = { $in: [] };
      }
    }

    const notes = await Note.find(filter).populate("size").sort({ createdAt: -1 }); 
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error in getAllNotes controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getNoteById(req, res) {
  try {
    const note = await Note.findById(req.params.id).populate("size");
    if (!note) return res.status(404).json({ message: "Note not found!" });
    res.json(note);
  } catch (error) {
    console.error("Error in getNoteById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getNextGlobalKeyId() {
  let boardConfig = await BoardConfig.findOne();
  if (!boardConfig) {
    boardConfig = await BoardConfig.create({ projectKey: "TB", taskCounter: 1 });
  }

  const rawKey = (boardConfig.projectKey || "TB").trim().toUpperCase();
  const prefix = rawKey.endsWith("-") ? rawKey : `${rawKey}-`;
  const counter = boardConfig.taskCounter || 1;
  const generatedId = `${prefix}${counter}`;

  boardConfig.taskCounter = counter + 1;
  await boardConfig.save();
  return generatedId;
}

async function getNextProjectKeyId(projectId) {
  if (!projectId) return null;
  const project = await Project.findById(projectId);
  if (!project || !project.projectKey || !project.projectKey.trim()) {
    return null;
  }
  const rawKey = project.projectKey.trim().toUpperCase();
  const prefix = rawKey.endsWith("-") ? rawKey : `${rawKey}-`;
  const counter = project.taskCounter || 1;
  const generatedId = `${prefix}${counter}`;

  project.taskCounter = counter + 1;
  await project.save();
  return generatedId;
}

export async function createNote(req, res) {
  try {
    let { title, content, status, priority, user, project, labels, checklist, startDate, dueDate, size, timeSpent } = req.body;

    let projDoc = null;
    if (project) {
      projDoc = await Project.findById(project);
      if (projDoc && (!user || user === "Sin asignar") && projDoc.defaultAssignee && projDoc.defaultAssignee !== "Sin asignar") {
        user = projDoc.defaultAssignee;
      }
    }

    // 1. Always generate globalKeyId
    const globalKeyId = await getNextGlobalKeyId();

    // 2. Generate projectKeyId if assigned to a project with projectKey
    let projectKeyId = null;
    if (projDoc && projDoc.projectKey && projDoc.projectKey.trim()) {
      const rawKey = projDoc.projectKey.trim().toUpperCase();
      const prefix = rawKey.endsWith("-") ? rawKey : `${rawKey}-`;
      const counter = projDoc.taskCounter || 1;
      projectKeyId = `${prefix}${counter}`;

      projDoc.taskCounter = counter + 1;
      await projDoc.save();
    }

    // 3. Set keyId: project-specific if present, otherwise global
    const keyId = projectKeyId || globalKeyId;

    const actor = user && user !== "Sin asignar" ? user : "Sistema";

    let completedAt = null;
    if (status) {
      const statusConfig = await StatusConfig.findOne({ name: status });
      if (statusConfig && statusConfig.category === "done") {
        completedAt = new Date();
      }
    }

    const note = new Note({
      globalKeyId,
      projectKeyId,
      keyId,
      title,
      content,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(user && { user }),
      ...(project && { project }),
      createdBy: req.user?._id || null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      ...(size && { size }),
      ...(timeSpent !== undefined && { timeSpent }),
      completedAt,
      labels: labels || [],
      checklist: checklist || [],
      activities: [
        {
          id: Date.now().toString(),
          type: "action",
          text: `${actor} agregó esta tarjeta a ${status || "Pendiente"}`,
          user: actor,
          createdAt: new Date(),
        },
      ],
    });

    const savedNote = await note.save();
    if (savedNote.size) {
      await savedNote.populate("size");
    }
    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error in createNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateNote(req, res) {
  try {
    const { title, content, status, priority, user, project, labels, checklist, activities, taskDriveLink, startDate, dueDate, size, timeSpent } = req.body;

    const currentNote = await Note.findById(req.params.id);
    if (!currentNote) return res.status(404).json({ message: "Note not found" });

    // Authorization: In this board, any authenticated user can update the note.
    let finalUser = user !== undefined ? user : currentNote.user;

    // Ensure note has a globalKeyId (handles legacy notes)
    let finalGlobalKeyId = currentNote.globalKeyId;
    if (!finalGlobalKeyId) {
      if (currentNote.keyId && !currentNote.project) {
        finalGlobalKeyId = currentNote.keyId;
      } else {
        finalGlobalKeyId = await getNextGlobalKeyId();
      }
    }

    let finalProject = currentNote.project;
    let finalProjectKeyId = currentNote.projectKeyId;
    let finalKeyId = currentNote.keyId || finalGlobalKeyId;
    let updatedActivities = activities !== undefined ? activities : (currentNote.activities || []);

    // Check if project assignment is being updated
    if (project !== undefined) {
      const currentProjId = currentNote.project ? currentNote.project.toString() : "";
      const incomingProjId = project ? project.toString() : "";

      if (incomingProjId !== currentProjId) {
        if (!incomingProjId) {
          // Desasignar de proyecto -> "Sin proyecto"
          finalProject = null;
          finalProjectKeyId = null;
          finalKeyId = finalGlobalKeyId;

          const actor = user || currentNote.user || "Sistema";
          updatedActivities.push({
            id: Date.now().toString(),
            type: "action",
            text: `${actor} desvinculó la tarea del proyecto (ID: ${finalGlobalKeyId})`,
            user: actor,
            createdAt: new Date(),
          });
        } else {
          // Asignar a un nuevo proyecto
          finalProject = incomingProjId;
          const targetProj = await Project.findById(incomingProjId);

          if (targetProj) {
            if (!finalUser || finalUser === "Sin asignar") {
              if (targetProj.defaultAssignee && targetProj.defaultAssignee !== "Sin asignar") {
                finalUser = targetProj.defaultAssignee;
              }
            }

            if (targetProj.projectKey && targetProj.projectKey.trim()) {
              finalProjectKeyId = await getNextProjectKeyId(incomingProjId);
              finalKeyId = finalProjectKeyId;
            } else {
              finalProjectKeyId = null;
              finalKeyId = finalGlobalKeyId;
            }

            const actor = user || currentNote.user || "Sistema";
            const idInfo = finalProjectKeyId ? ` con ID [${finalProjectKeyId}]` : "";
            updatedActivities.push({
              id: Date.now().toString(),
              type: "action",
              text: `${actor} asignó la tarea al proyecto "${targetProj.name}"${idInfo}`,
              user: actor,
              createdAt: new Date(),
            });
          }
        }
      }
    }

    let completedAt = currentNote.completedAt;
    
    // Auto log status changes if status was modified and changed
    if (status !== undefined && status !== currentNote.status) {
      const statusConfig = await StatusConfig.findOne({ name: status });
      if (statusConfig && statusConfig.category === "done") {
        completedAt = new Date();
      } else if (currentNote.completedAt) {
        completedAt = null; // Revert completion if moving out of 'done'
      }

      const actor = user || currentNote.user || "Usuario";
      updatedActivities.push({
        id: Date.now().toString(),
        type: "action",
        text: `${actor} movió esta tarjeta a ${status}`,
        user: actor,
        createdAt: new Date(),
      });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        user: finalUser,
        project: finalProject,
        globalKeyId: finalGlobalKeyId,
        projectKeyId: finalProjectKeyId,
        keyId: finalKeyId,
        ...(labels !== undefined && { labels }),
        ...(checklist !== undefined && { checklist }),
        ...(taskDriveLink !== undefined && { taskDriveLink }),
        ...(startDate !== undefined && { startDate }),
        ...(dueDate !== undefined && { dueDate }),
        ...(size !== undefined && { size: size === "" ? null : size }),
        ...(timeSpent !== undefined && { timeSpent }),
        completedAt,
        activities: updatedActivities,
      },
      {
        new: true,
      }
    ).populate("size");

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error in updateNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function addComment(req, res) {
  try {
    const { text, user, parentId, mentions = [] } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "El texto del comentario es obligatorio" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Validate parentId if provided
    if (parentId) {
      const parentComment = note.activities.find(
        (act) => (act.id === parentId || act._id.toString() === parentId) && act.type === "comment"
      );
      if (!parentComment) {
        return res.status(404).json({ message: "El comentario original no existe" });
      }
      // If the parent comment already has a parentId, it is a reply. Cannot reply to replies.
      if (parentComment.parentId) {
        return res.status(400).json({ message: "No se puede responder a una respuesta (hilo de nivel 2 no permitido)" });
      }
    }

    const actor = user || note.user || "Usuario";

    const newComment = {
      id: Date.now().toString(),
      type: "comment",
      text: text.trim(),
      user: actor,
      createdAt: new Date(),
      parentId: parentId || null,
      mentions,
    };

    note.activities.push(newComment);
    const updatedNote = await note.save();

    res.status(201).json(updatedNote);
  } catch (error) {
    console.error("Error in addComment controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteNote(req, res) {
  try {
    const currentNote = await Note.findById(req.params.id);
    if (!currentNote) return res.status(404).json({ message: "Note not found" });

    // Authorization: only the creator or admin can delete
    const isOwner = currentNote.createdBy && req.user && currentNote.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para archivar esta nota" });
    }

    await Note.findByIdAndUpdate(req.params.id, { archived: true });
    res.status(200).json({ message: "Note archived successfully!" });
  } catch (error) {
    console.error("Error in deleteNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
