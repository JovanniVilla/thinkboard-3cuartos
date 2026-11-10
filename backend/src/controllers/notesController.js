import Note from "../models/Note.js";
import BoardConfig from "../models/BoardConfig.js";
import StatusConfig from "../models/StatusConfig.js";
import TaskSizeConfig from "../models/TaskSizeConfig.js";
import Project from "../models/Project.js";
import Subtask from "../models/Subtask.js";
import VideoNote from "../models/VideoNote.js";
import { syncTaskFilesStatus } from "../utils/fileSync.js";
import {
  generateActivityId,
  buildProjectTaskActivity,
  appendProjectActivities,
} from "../utils/projectActivity.js";

function formatShortDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateKey(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

function normalizeObjectIdStr(val) {
  if (!val) return "";
  if (typeof val === "object") return String(val._id || "");
  return String(val);
}

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
    let {
      title,
      content,
      status,
      priority,
      value,
      user,
      project,
      labels,
      checklist,
      startDate,
      dueDate,
      size,
      timeSpent,
    } = req.body;

    let projDoc = null;
    if (project) {
      projDoc = await Project.findById(project);
      if (
        projDoc &&
        (!user || user === "Sin asignar") &&
        projDoc.defaultAssignee &&
        projDoc.defaultAssignee !== "Sin asignar"
      ) {
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

    const actor = req.user?.name || (user && user !== "Sin asignar" ? user : "Sistema");
    const initialStatus = status || "Pendiente";

    let completedAt = null;
    if (status) {
      const statusConfig = await StatusConfig.findOne({ name: status });
      const isDone =
        (statusConfig && statusConfig.category === "done") ||
        /^(completad|terminad|finalizad|listo|hecho|done|cerrad)/i.test(status.trim());
      if (isDone) {
        completedAt = new Date();
      }
    }

    const creationActId = generateActivityId();
    const now = new Date();

    const note = new Note({
      globalKeyId,
      projectKeyId,
      keyId,
      title,
      content,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(value && { value }),
      ...(user && { user }),
      ...(project && { project }),
      createdBy: req.user?._id || null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      ...(size && { size: normalizeObjectIdStr(size) || null }),
      ...(timeSpent !== undefined && { timeSpent }),
      completedAt,
      labels: labels || [],
      checklist: checklist || [],
      activities: [
        {
          id: creationActId,
          type: "action",
          text: `${actor} creó esta tarea en "${initialStatus}"`,
          user: actor,
          createdAt: now,
        },
      ],
    });

    const savedNote = await note.save();
    if (savedNote.size) {
      await savedNote.populate("size");
    }

    if (savedNote.project) {
      const assigneeInfo =
        savedNote.user && savedNote.user !== "Sin asignar"
          ? ` · Asignada a ${savedNote.user}`
          : "";
      await appendProjectActivities(
        savedNote.project,
        buildProjectTaskActivity({
          note: savedNote,
          user: actor,
          text: `Creó la tarea en estado "${initialStatus}"${assigneeInfo}`,
          type: "task_action",
          sourceActivityId: creationActId,
          createdAt: now,
        })
      );
    }

    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error in createNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateNote(req, res) {
  try {
    const {
      title,
      content,
      status,
      priority,
      value,
      user,
      project,
      labels,
      checklist,
      activities,
      taskDriveLink,
      startDate,
      dueDate,
      size,
      timeSpent,
      archived,
    } = req.body;

    const currentNote = await Note.findById(req.params.id);
    if (!currentNote) return res.status(404).json({ message: "Note not found" });

    const actor = req.user?.name || currentNote.user || "Usuario";

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
    let updatedActivities =
      activities !== undefined ? [...activities] : [...(currentNote.activities || [])];

    const projectActivitiesByProjId = new Map();

    const addProjectEntry = (projId, entry) => {
      const pid = projId ? String(projId) : "";
      if (!pid) return;
      const list = projectActivitiesByProjId.get(pid) || [];
      list.push(entry);
      projectActivitiesByProjId.set(pid, list);
    };

    const getRefNote = () => ({
      _id: currentNote._id,
      projectKeyId: finalProjectKeyId,
      keyId: finalKeyId,
      globalKeyId: finalGlobalKeyId,
      title: title !== undefined ? title.trim() : currentNote.title,
    });

    const recordAction = (noteText, projectText, targetProjId = finalProject) => {
      const actId = generateActivityId();
      const now = new Date();
      updatedActivities.push({
        id: actId,
        type: "action",
        text: noteText,
        user: actor,
        createdAt: now,
      });

      if (targetProjId) {
        addProjectEntry(
          targetProjId,
          buildProjectTaskActivity({
            note: getRefNote(),
            user: actor,
            text: projectText,
            type: "task_action",
            sourceActivityId: actId,
            createdAt: now,
          })
        );
      }
    };

    // 1. Check if project assignment is being updated
    if (project !== undefined) {
      const currentProjId = currentNote.project ? currentNote.project.toString() : "";
      const incomingProjId = project ? project.toString() : "";

      if (incomingProjId !== currentProjId) {
        if (!incomingProjId) {
          // Unlink from old project -> "Sin proyecto"
          const oldNoteRef = {
            _id: currentNote._id,
            projectKeyId: currentNote.projectKeyId,
            keyId: currentNote.keyId,
            globalKeyId: finalGlobalKeyId,
            title: currentNote.title,
          };

          finalProject = null;
          finalProjectKeyId = null;
          finalKeyId = finalGlobalKeyId;

          const actId = generateActivityId();
          const now = new Date();
          updatedActivities.push({
            id: actId,
            type: "action",
            text: `${actor} desvinculó la tarea del proyecto (ID: ${finalGlobalKeyId})`,
            user: actor,
            createdAt: now,
          });

          if (currentProjId) {
            addProjectEntry(
              currentProjId,
              buildProjectTaskActivity({
                note: oldNoteRef,
                user: actor,
                text: "Desvinculó la tarea de este proyecto",
                type: "task_action",
                sourceActivityId: actId,
                createdAt: now,
              })
            );
          }
        } else {
          // Assign to a new project
          finalProject = incomingProjId;
          const targetProj = await Project.findById(incomingProjId);

          if (targetProj) {
            if (!finalUser || finalUser === "Sin asignar") {
              if (
                targetProj.defaultAssignee &&
                targetProj.defaultAssignee !== "Sin asignar"
              ) {
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

            const actId = generateActivityId();
            const now = new Date();
            const idInfo = finalProjectKeyId ? ` con ID [${finalProjectKeyId}]` : "";

            updatedActivities.push({
              id: actId,
              type: "action",
              text: `${actor} asignó la tarea al proyecto "${targetProj.name}"${idInfo}`,
              user: actor,
              createdAt: now,
            });

            if (currentProjId) {
              addProjectEntry(
                currentProjId,
                buildProjectTaskActivity({
                  note: {
                    _id: currentNote._id,
                    projectKeyId: currentNote.projectKeyId,
                    keyId: currentNote.keyId,
                    globalKeyId: finalGlobalKeyId,
                    title: currentNote.title,
                  },
                  user: actor,
                  text: `Movió la tarea al proyecto "${targetProj.name}"`,
                  type: "task_action",
                  createdAt: now,
                })
              );
            }

            addProjectEntry(
              incomingProjId,
              buildProjectTaskActivity({
                note: getRefNote(),
                user: actor,
                text: `Vinculó la tarea al proyecto (Estado: "${status || currentNote.status || "Pendiente"}")`,
                type: "task_action",
                sourceActivityId: actId,
                createdAt: now,
              })
            );
          }
        }
      }
    }

    let completedAt = currentNote.completedAt;

    // 2. Status change
    if (status !== undefined && status !== currentNote.status) {
      const statusConfig = await StatusConfig.findOne({ name: status });
      const isDone =
        (statusConfig && statusConfig.category === "done") ||
        /^(completad|terminad|finalizad|listo|hecho|done|cerrad)/i.test(status.trim());
      if (isDone) {
        completedAt = new Date();
      } else if (currentNote.completedAt) {
        completedAt = null;
      }

      const prevStatus = currentNote.status || "Pendiente";
      recordAction(
        `${actor} movió esta tarea de "${prevStatus}" a "${status}"`,
        `Cambió el estado de "${prevStatus}" a "${status}"`
      );
    }

    // 3. Priority change
    if (priority !== undefined && priority !== currentNote.priority) {
      const prevPriority = currentNote.priority || "Media";
      recordAction(
        `${actor} cambió la prioridad de "${prevPriority}" a "${priority}"`,
        `Cambió la prioridad de "${prevPriority}" a "${priority}"`
      );
    }

    // 3.1 Value change
    if (value !== undefined && value !== currentNote.value) {
      const prevValue = currentNote.value || "Medio";
      recordAction(
        `${actor} cambió el valor de "${prevValue}" a "${value}"`,
        `Cambió el valor de "${prevValue}" a "${value}"`
      );
    }

    // 4. Assignee change
    const oldAssignee = currentNote.user || "Sin asignar";
    const newAssignee = finalUser || "Sin asignar";
    if (newAssignee !== oldAssignee) {
      if (newAssignee === "Sin asignar") {
        recordAction(
          `${actor} quitó la asignación de ${oldAssignee}`,
          `Quitó la asignación de ${oldAssignee}`
        );
      } else if (oldAssignee === "Sin asignar") {
        recordAction(
          `${actor} asignó la tarea a ${newAssignee}`,
          `Asignó la tarea a ${newAssignee}`
        );
      } else {
        recordAction(
          `${actor} reasignó la tarea de ${oldAssignee} a ${newAssignee}`,
          `Reasignó la tarea de ${oldAssignee} a ${newAssignee}`
        );
      }
    }

    // 5. Title change
    if (title !== undefined && title.trim() !== (currentNote.title || "").trim()) {
      recordAction(
        `${actor} renombró la tarea a "${title.trim()}"`,
        `Renombró la tarea de "${currentNote.title}" a "${title.trim()}"`
      );
    }

    // 6. Content (description) change
    if (content !== undefined && content.trim() !== (currentNote.content || "").trim()) {
      recordAction(
        `${actor} actualizó la descripción de la tarea`,
        "Actualizó la descripción de la tarea"
      );
    }

    // 7. Checklist changes
    if (checklist !== undefined && Array.isArray(checklist)) {
      const oldChecklist = currentNote.checklist || [];
      const getItemKey = (item) => String(item.id || item._id || "");
      const oldMap = new Map(oldChecklist.map((item) => [getItemKey(item), item]));
      const newMap = new Map(checklist.map((item) => [getItemKey(item), item]));

      if (oldChecklist.length > 1 && checklist.length === 0) {
        recordAction(
          `${actor} eliminó todos los elementos del checklist (${oldChecklist.length})`,
          `Eliminó todos los elementos del checklist (${oldChecklist.length})`
        );
      } else {
        for (const [key, newItem] of newMap.entries()) {
          if (!key || !oldMap.has(key)) {
            recordAction(
              `${actor} agregó "${newItem.title}" al checklist`,
              `Agregó "${newItem.title}" al checklist`
            );
          } else {
            const oldItem = oldMap.get(key);
            if (Boolean(oldItem.completed) !== Boolean(newItem.completed)) {
              if (newItem.completed) {
                recordAction(
                  `${actor} completó "${newItem.title}" en el checklist`,
                  `Completó "${newItem.title}" en el checklist`
                );
              } else {
                recordAction(
                  `${actor} marcó como pendiente "${newItem.title}" en el checklist`,
                  `Marcó como pendiente "${newItem.title}" en el checklist`
                );
              }
            }
            if ((oldItem.title || "").trim() !== (newItem.title || "").trim()) {
              recordAction(
                `${actor} editó "${oldItem.title}" a "${newItem.title}" en el checklist`,
                `Editó en checklist: "${oldItem.title}" → "${newItem.title}"`
              );
            }
          }
        }

        for (const [key, oldItem] of oldMap.entries()) {
          if (key && !newMap.has(key)) {
            recordAction(
              `${actor} eliminó "${oldItem.title}" del checklist`,
              `Eliminó "${oldItem.title}" del checklist`
            );
          }
        }
      }
    }

    // 8. Labels changes
    if (labels !== undefined && Array.isArray(labels)) {
      const oldLabels = new Set((currentNote.labels || []).map((l) => l.name));
      const newLabels = new Set(labels.map((l) => l.name));

      for (const lbl of newLabels) {
        if (!oldLabels.has(lbl)) {
          recordAction(
            `${actor} agregó la etiqueta "${lbl}"`,
            `Agregó la etiqueta "${lbl}"`
          );
        }
      }
      for (const lbl of oldLabels) {
        if (!newLabels.has(lbl)) {
          recordAction(
            `${actor} quitó la etiqueta "${lbl}"`,
            `Quitó la etiqueta "${lbl}"`
          );
        }
      }
    }

    // 9. Start date & Due date changes
    if (startDate !== undefined && toDateKey(startDate) !== toDateKey(currentNote.startDate)) {
      if (startDate) {
        const formatted = formatShortDate(startDate);
        recordAction(
          `${actor} estableció la fecha de inicio: ${formatted}`,
          `Estableció fecha de inicio: ${formatted}`
        );
      } else {
        recordAction(
          `${actor} eliminó la fecha de inicio`,
          "Eliminó la fecha de inicio"
        );
      }
    }

    if (dueDate !== undefined && toDateKey(dueDate) !== toDateKey(currentNote.dueDate)) {
      if (dueDate) {
        const formatted = formatShortDate(dueDate);
        recordAction(
          `${actor} estableció la fecha límite: ${formatted}`,
          `Estableció fecha límite: ${formatted}`
        );
      } else {
        recordAction(
          `${actor} eliminó la fecha límite`,
          "Eliminó la fecha límite"
        );
      }
    }

    // 10. Task Size (estimación) change
    const normalizedIncomingSize =
      size !== undefined ? normalizeObjectIdStr(size) : undefined;
    if (
      normalizedIncomingSize !== undefined &&
      normalizedIncomingSize !== normalizeObjectIdStr(currentNote.size)
    ) {
      if (normalizedIncomingSize) {
        const sizeDoc = await TaskSizeConfig.findById(normalizedIncomingSize);
        const sizeLabel = sizeDoc
          ? `${sizeDoc.name} (${sizeDoc.value}h)`
          : "nuevo tamaño";
        recordAction(
          `${actor} asignó tamaño estimado: ${sizeLabel}`,
          `Cambió tamaño estimado a ${sizeLabel}`
        );
      } else {
        recordAction(
          `${actor} quitó el tamaño estimado`,
          "Quitó el tamaño estimado"
        );
      }
    }

    // 11. Drive link change
    if (
      taskDriveLink !== undefined &&
      (taskDriveLink || "").trim() !== (currentNote.taskDriveLink || "").trim()
    ) {
      if ((taskDriveLink || "").trim()) {
        recordAction(
          `${actor} actualizó el enlace de Drive`,
          "Actualizó el enlace de archivos (Drive)"
        );
      } else {
        recordAction(
          `${actor} eliminó el enlace de Drive`,
          "Eliminó el enlace de archivos (Drive)"
        );
      }
    }

    // 12. Manual timeSpent change
    if (
      timeSpent !== undefined &&
      Number(timeSpent) !== Number(currentNote.timeSpent || 0)
    ) {
      recordAction(
        `${actor} actualizó el tiempo invertido a ${timeSpent}h`,
        `Actualizó el tiempo invertido a ${timeSpent}h`
      );
    }

    // 13. Archive / Restore change
    if (
      archived !== undefined &&
      Boolean(archived) !== Boolean(currentNote.archived)
    ) {
      if (archived) {
        recordAction(`${actor} archivó la tarea`, "Archivó la tarea");
      } else {
        recordAction(
          `${actor} restauró la tarea al tablero`,
          "Restauró la tarea archivada"
        );
      }
    }

    // 14. Sync edited task comment text to Project.activities if applicable
    if (activities !== undefined && Array.isArray(activities) && finalProject) {
      const oldActMap = new Map(
        (currentNote.activities || []).map((a) => [String(a.id || a._id), a])
      );
      for (const act of activities) {
        const actKey = String(act.id || act._id || "");
        const oldAct = oldActMap.get(actKey);
        if (
          oldAct &&
          oldAct.type === "comment" &&
          (oldAct.text || "").trim() !== (act.text || "").trim()
        ) {
          const syncedText = act.parentId
            ? `Respondió: ${act.text.trim()}`
            : act.text.trim();
          await Project.updateOne(
            { _id: finalProject, "activities.sourceActivityId": actKey },
            {
              $set: {
                "activities.$.text": syncedText,
                "activities.$.editedAt": new Date(),
              },
            }
          ).catch(() => {});
        }
      }
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(value !== undefined && { value }),
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
        ...(normalizedIncomingSize !== undefined && {
          size: normalizedIncomingSize || null,
        }),
        ...(timeSpent !== undefined && { timeSpent }),
        completedAt,
        ...(archived !== undefined && { archived }),
        activities: updatedActivities,
      },
      {
        new: true,
      }
    ).populate("size");

    // Persist collected project activity logs
    for (const [projId, entries] of projectActivitiesByProjId.entries()) {
      await appendProjectActivities(projId, entries);
    }

    // Sync files lifecycle if archived state was updated
    if (archived !== undefined && archived !== currentNote.archived) {
      await syncTaskFilesStatus(req.params.id, archived ? "archived" : "active");
    }

    // Sync checklist changes with associated Subtasks (pins) and VideoNotes
    if (checklist !== undefined && Array.isArray(checklist)) {
      for (const item of checklist) {
        if (item.subtaskId) {
          const subtaskStatus = item.completed ? "completed" : "pending";
          await Subtask.findByIdAndUpdate(item.subtaskId, { status: subtaskStatus });
        }
        if (item.videoNoteId) {
          const videoStatus = item.completed ? "resolved" : "pending";
          await VideoNote.findByIdAndUpdate(item.videoNoteId, { status: videoStatus });
        }
      }
    }

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
      return res
        .status(400)
        .json({ message: "El texto del comentario es obligatorio" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Validate parentId if provided
    if (parentId) {
      const parentComment = note.activities.find(
        (act) =>
          (act.id === parentId || act._id.toString() === parentId) &&
          act.type === "comment"
      );
      if (!parentComment) {
        return res
          .status(404)
          .json({ message: "El comentario original no existe" });
      }
      if (parentComment.parentId) {
        return res.status(400).json({
          message:
            "No se puede responder a una respuesta (hilo de nivel 2 no permitido)",
        });
      }
    }

    const actor = req.user?.name || user || note.user || "Usuario";
    const commentId = generateActivityId();
    const now = new Date();

    const newComment = {
      id: commentId,
      type: "comment",
      text: text.trim(),
      user: actor,
      createdAt: now,
      parentId: parentId || null,
      mentions,
    };

    note.activities.push(newComment);
    const updatedNote = await note.save();
    if (updatedNote.size) {
      await updatedNote.populate("size");
    }

    if (updatedNote.project) {
      await appendProjectActivities(
        updatedNote.project,
        buildProjectTaskActivity({
          note: updatedNote,
          user: actor,
          text: parentId ? `Respondió: ${text.trim()}` : text.trim(),
          type: "task_comment",
          sourceActivityId: commentId,
          createdAt: now,
        })
      );
    }

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
    const isOwner =
      currentNote.createdBy &&
      req.user &&
      currentNote.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para archivar o eliminar esta nota" });
    }

    const actor = req.user?.name || "Usuario";
    const now = new Date();
    const isPermanent =
      req.query.permanent === "true" || req.query.force === "true";

    if (isPermanent) {
      if (currentNote.project) {
        await appendProjectActivities(
          currentNote.project,
          buildProjectTaskActivity({
            note: currentNote,
            user: actor,
            text: "Eliminó permanentemente la tarea",
            type: "task_action",
            createdAt: now,
            includeTaskId: false,
          })
        );
      }
      await syncTaskFilesStatus(currentNote._id, "deleted");
      await Note.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Nota eliminada permanentemente" });
    }

    const actId = generateActivityId();
    await Note.findByIdAndUpdate(req.params.id, {
      archived: true,
      $push: {
        activities: {
          id: actId,
          type: "action",
          text: `${actor} archivó la tarea`,
          user: actor,
          createdAt: now,
        },
      },
    });

    if (currentNote.project) {
      await appendProjectActivities(
        currentNote.project,
        buildProjectTaskActivity({
          note: currentNote,
          user: actor,
          text: "Archivó la tarea",
          type: "task_action",
          sourceActivityId: actId,
          createdAt: now,
        })
      );
    }

    await syncTaskFilesStatus(currentNote._id, "archived");
    res.status(200).json({ message: "Note archived successfully!" });
  } catch (error) {
    console.error("Error in deleteNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
