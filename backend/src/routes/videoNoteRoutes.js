import express from "express";
import {
  uploadVideoNote,
  getVideoNotesByTask,
  getVideoNoteById,
  deleteVideoNote,
} from "../controllers/videoNoteController.js";
import { protectRoute } from "../middleware/auth.js";
import { uploadSingleVideo } from "../middleware/upload.js";

const router = express.Router();

router.use(protectRoute);

// Task video notes routes (e.g. POST /api/tasks/:taskId/video-notes or /api/notes/:taskId/video-notes)
router.post("/:taskId/video-notes", uploadSingleVideo, uploadVideoNote);
router.get("/:taskId/video-notes", getVideoNotesByTask);

// Individual video note routes
router.get("/:id", getVideoNoteById);
router.delete("/:id", deleteVideoNote);

export default router;
