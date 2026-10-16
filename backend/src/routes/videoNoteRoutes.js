import express from "express";
import {
  uploadVideoNote,
  getVideoNotesByTask,
  getVideoNoteById,
  deleteVideoNote,
  updateVideoNoteStatus,
  streamVideoNote,
} from "../controllers/videoNoteController.js";
import { protectRoute } from "../middleware/auth.js";
import { uploadSingleVideo } from "../middleware/upload.js";

const router = express.Router();

// Stream video note (accessible for video element playback with Range headers)
router.get("/:id/stream", streamVideoNote);

router.use(protectRoute);

// Task video notes routes (e.g. POST /api/tasks/:taskId/video-notes or /api/notes/:taskId/video-notes)
router.post("/:taskId/video-notes", uploadSingleVideo, uploadVideoNote);
router.get("/:taskId/video-notes", getVideoNotesByTask);

// Individual video note routes
router.get("/:id", getVideoNoteById);
router.patch("/:id/status", updateVideoNoteStatus);
router.patch("/:id", updateVideoNoteStatus);
router.delete("/:id", deleteVideoNote);

export default router;
