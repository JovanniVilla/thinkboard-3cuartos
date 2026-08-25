import express from "express";
import { getAllProjects, createProject, updateProject, deleteProject } from "../controllers/projectController.js";
import { protectRoute, requireAdminOrTeam } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllProjects);
router.post("/", protectRoute, requireAdminOrTeam, createProject);
router.put("/:id", protectRoute, requireAdminOrTeam, updateProject);
router.delete("/:id", protectRoute, requireAdminOrTeam, deleteProject);

export default router;
