import express from "express";
import { getProjectTypes, createProjectType, updateProjectType, deleteProjectType } from "../controllers/projectTypeController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getProjectTypes);
router.post("/", requireAuth, requireAdmin, createProjectType);
router.put("/:id", requireAuth, requireAdmin, updateProjectType);
router.delete("/:id", requireAuth, requireAdmin, deleteProjectType);

export default router;
