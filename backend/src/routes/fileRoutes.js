import express from "express";
import {
  uploadTaskFile,
  getTaskFiles,
  getFileById,
  deleteFile,
} from "../controllers/fileController.js";
import { getFileSubtasks } from "../controllers/subtaskController.js";
import { protectRoute } from "../middleware/auth.js";
import { uploadSingleFile } from "../middleware/upload.js";

const router = express.Router();

router.use(protectRoute);

// Task files routes (can be mounted on /api/tasks or /api/notes or /api/files)
router.post("/:taskId/files", uploadSingleFile, uploadTaskFile);
router.get("/:taskId/files", getTaskFiles);

// Individual file routes
router.get("/:fileId", getFileById);
router.delete("/:fileId", deleteFile);

// File subtasks (pins)
router.get("/:fileId/subtasks", getFileSubtasks);

export default router;
