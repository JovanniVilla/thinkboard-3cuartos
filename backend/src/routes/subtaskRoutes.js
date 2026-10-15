import express from "express";
import {
  createSubtask,
  getTaskSubtasks,
  updateSubtask,
  deleteSubtask,
} from "../controllers/subtaskController.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createSubtask);
router.get("/task/:taskId", getTaskSubtasks);
router.patch("/:subtaskId", updateSubtask);
router.put("/:subtaskId", updateSubtask);
router.delete("/:subtaskId", deleteSubtask);

export default router;
