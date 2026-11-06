import mongoose from "mongoose";
import Project from "../models/Project.js";

/**
 * Generates a unique activity ID safe against same-millisecond collisions.
 */
export function generateActivityId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Builds a standardized project activity entry linked to a task (Note).
 */
export function buildProjectTaskActivity({
  note,
  user = "Usuario",
  text,
  type = "task_action",
  sourceActivityId = null,
  createdAt = new Date(),
  includeTaskId = true,
}) {
  return {
    id: generateActivityId(),
    type,
    text,
    user: user || "Usuario",
    taskId: includeTaskId && note?._id ? note._id : null,
    taskKeyId: note?.projectKeyId || note?.keyId || note?.globalKeyId || null,
    taskTitle: note?.title || null,
    sourceActivityId: sourceActivityId ? String(sourceActivityId) : null,
    createdAt,
  };
}

/**
 * Atomically appends one or multiple activity entries to a Project's activities array.
 */
export async function appendProjectActivities(projectId, entries = []) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return;

  const list = (Array.isArray(entries) ? entries : [entries]).filter(
    (entry) => entry && entry.text
  );
  if (list.length === 0) return;

  const formatted = list.map((entry) => ({
    id: entry.id || generateActivityId(),
    type: entry.type || "task_action",
    text: entry.text,
    user: entry.user || "Usuario",
    taskId: entry.taskId || null,
    taskKeyId: entry.taskKeyId || null,
    taskTitle: entry.taskTitle || null,
    sourceActivityId: entry.sourceActivityId ? String(entry.sourceActivityId) : null,
    editedAt: entry.editedAt || null,
    createdAt: entry.createdAt || new Date(),
  }));

  try {
    await Project.findByIdAndUpdate(projectId, {
      $push: {
        activities: { $each: formatted },
      },
    });
  } catch (err) {
    // Handle edge case where legacy DB document has non-array activities (e.g., "")
    try {
      const proj = await Project.findById(projectId);
      if (proj) {
        const existing = Array.isArray(proj.activities) ? proj.activities : [];
        proj.activities = [...existing, ...formatted];
        await proj.save();
      }
    } catch (fallbackErr) {
      console.error("Error appending project activities:", fallbackErr || err);
    }
  }
}

/**
 * Merges a Project's stored activities with historical activities from its tasks
 * (deduplicated via sourceActivityId) so legacy task history is also visible.
 */
export function mergeProjectWithTaskActivities(projectObj, projectNotes = []) {
  const rawProjectActivities = Array.isArray(projectObj.activities)
    ? projectObj.activities
    : [];

  const recordedSourceIds = new Set();
  for (const act of rawProjectActivities) {
    if (act.sourceActivityId) {
      recordedSourceIds.add(String(act.sourceActivityId));
    }
  }

  const legacyTaskActivities = [];
  for (const task of projectNotes) {
    if (!Array.isArray(task.activities)) continue;
    const taskKeyId = task.projectKeyId || task.keyId || task.globalKeyId || null;

    for (const act of task.activities) {
      // Skip threaded replies if desired? No, include all comments & actions with context
      const actKey = String(act.id || act._id || "");
      if (actKey && recordedSourceIds.has(actKey)) continue;

      legacyTaskActivities.push({
        id: `task-${task._id}-${actKey || Math.random().toString(36).substring(2, 7)}`,
        type: act.type === "comment" ? "task_comment" : "task_action",
        text: act.parentId ? `Respondió: ${act.text}` : act.text,
        user: act.user || "Sistema",
        taskId: task._id,
        taskKeyId,
        taskTitle: task.title,
        sourceActivityId: actKey || null,
        editedAt: act.updatedAt && act.updatedAt !== act.createdAt ? act.updatedAt : null,
        createdAt: act.createdAt || task.createdAt,
      });
    }
  }

  const combined = [...rawProjectActivities, ...legacyTaskActivities].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return {
    ...projectObj,
    activities: combined,
  };
}

