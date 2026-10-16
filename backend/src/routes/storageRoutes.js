import express from "express";
import {
  getStorageStats,
  getStorageFiles,
  deleteStorageFile,
  bulkDeleteOrphanFiles,
} from "../controllers/storageController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All storage routes require authentication
router.use(protectRoute);

// Admin-only metrics and global file listing
router.get("/stats", requireAdmin, getStorageStats);
router.get("/files", requireAdmin, getStorageFiles);

// Admin-only bulk purge of orphans (must be declared BEFORE /files/:fileId to prevent route conflict)
router.delete("/files/bulk-orphans", requireAdmin, bulkDeleteOrphanFiles);

// Delete file: Admin or Owner
router.delete("/files/:fileId", deleteStorageFile);

export default router;
