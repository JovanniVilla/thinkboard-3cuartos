import express from "express";
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  addProjectComment,
  editProjectComment,
} from "../controllers/projectController.js";
import { protectRoute, requireAdminOrTeam } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllProjects);
router.get("/:id", protectRoute, getProjectById);
router.post("/", protectRoute, requireAdminOrTeam, createProject);
router.put("/:id", protectRoute, requireAdminOrTeam, updateProject);
router.post("/:id/comments", protectRoute, addProjectComment);
router.patch("/:id/comments/:commentId", protectRoute, editProjectComment);
router.delete("/:id", protectRoute, requireAdminOrTeam, deleteProject);

export default router;
