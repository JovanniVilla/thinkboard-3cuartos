import express from "express";
import { getProjectTypes, createProjectType, updateProjectType, deleteProjectType } from "../controllers/projectTypeController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getProjectTypes);
router.post("/", protectRoute, requireAdmin, createProjectType);
router.put("/:id", protectRoute, requireAdmin, updateProjectType);
router.delete("/:id", protectRoute, requireAdmin, deleteProjectType);

export default router;
