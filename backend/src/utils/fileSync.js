import File from "../models/File.js";
import VideoNote from "../models/VideoNote.js";
import Note from "../models/Note.js";

/**
 * Synchronize the parentStatus and markedForDeletionAt of all files and video notes
 * belonging to a given task.
 * 
 * @param {string|mongoose.Types.ObjectId} taskId 
 * @param {'active'|'archived'|'deleted'} status 
 */
export async function syncTaskFilesStatus(taskId, status) {
  if (!taskId) return;

  const validStatuses = ["active", "archived", "deleted"];
  if (!validStatuses.includes(status)) {
    console.warn(`[fileSync] Invalid status: ${status}`);
    return;
  }

  const updatePayload = {
    parentStatus: status,
    markedForDeletionAt: status === "deleted" ? new Date() : null,
  };

  try {
    await Promise.all([
      File.updateMany({ taskId }, updatePayload),
      VideoNote.updateMany({ taskId }, updatePayload),
    ]);
  } catch (error) {
    console.error(`[fileSync] Error syncing files for task ${taskId}:`, error);
  }
}

/**
 * Self-healing reconciliation: inspects files and video notes to ensure their
 * parentStatus matches the parent task existence and archived status.
 */
export async function reconcileFilesLifecycle() {
  try {
    // 1. Get all notes with their archived state
    const allNotes = await Note.find({}, "_id archived").lean();
    const activeNoteIds = new Set();
    const archivedNoteIds = new Set();

    allNotes.forEach((note) => {
      const idStr = note._id.toString();
      if (note.archived) {
        archivedNoteIds.add(idStr);
      } else {
        activeNoteIds.add(idStr);
      }
    });

    // Helper to process collection
    const reconcileCollection = async (Model, modelName) => {
      const docs = await Model.find({}, "_id taskId parentStatus markedForDeletionAt createdAt").lean();
      let updatedCount = 0;

      for (const doc of docs) {
        const taskIdStr = doc.taskId ? doc.taskId.toString() : null;
        let expectedStatus = "deleted";

        if (taskIdStr && activeNoteIds.has(taskIdStr)) {
          expectedStatus = "active";
        } else if (taskIdStr && archivedNoteIds.has(taskIdStr)) {
          expectedStatus = "archived";
        } else {
          // Task does not exist -> orphan / deleted
          expectedStatus = "deleted";
        }

        const needsStatusUpdate = doc.parentStatus !== expectedStatus;
        const needsDeletionDate = expectedStatus === "deleted" && !doc.markedForDeletionAt;

        if (needsStatusUpdate || needsDeletionDate) {
          const update = { parentStatus: expectedStatus };
          if (expectedStatus === "deleted" && !doc.markedForDeletionAt) {
            update.markedForDeletionAt = doc.createdAt || new Date();
          } else if (expectedStatus !== "deleted" && doc.markedForDeletionAt) {
            update.markedForDeletionAt = null;
          }

          await Model.updateOne({ _id: doc._id }, { $set: update });
          updatedCount++;
        }
      }
      return updatedCount;
    };

    const filesUpdated = await reconcileCollection(File, "File");
    const videosUpdated = await reconcileCollection(VideoNote, "VideoNote");

    return { filesUpdated, videosUpdated };
  } catch (error) {
    console.error("[fileSync] Error reconciling files lifecycle:", error);
    return { filesUpdated: 0, videosUpdated: 0, error: error.message };
  }
}
