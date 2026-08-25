import express from "express";
import { getProjectStatuses, createProjectStatus, updateProjectStatus, deleteProjectStatus } from "../controllers/projectStatusController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getProjectStatuses);
router.post("/", requireAuth, requireAdmin, createProjectStatus);
router.put("/:id", requireAuth, requireAdmin, updateProjectStatus);
router.delete("/:id", requireAuth, requireAdmin, deleteProjectStatus);

export default router;
