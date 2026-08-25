import express from "express";
import { getProjectStatuses, createProjectStatus, updateProjectStatus, deleteProjectStatus } from "../controllers/projectStatusController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getProjectStatuses);
router.post("/", protectRoute, requireAdmin, createProjectStatus);
router.put("/:id", protectRoute, requireAdmin, updateProjectStatus);
router.delete("/:id", protectRoute, requireAdmin, deleteProjectStatus);

export default router;
