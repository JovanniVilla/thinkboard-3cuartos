import express from "express";
import { getAllProjects, createProject, updateProject, deleteProject, getProjectById } from "../controllers/projectController.js";
import { protectRoute, requireAdminOrTeam } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllProjects);
router.get("/:id", protectRoute, getProjectById);
router.post("/", protectRoute, requireAdminOrTeam, createProject);
router.put("/:id", protectRoute, requireAdminOrTeam, updateProject);
router.delete("/:id", protectRoute, requireAdminOrTeam, deleteProject);

export default router;
