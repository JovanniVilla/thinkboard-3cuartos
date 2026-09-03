import express from "express";
import {
  getTaskSizes,
  createTaskSize,
  updateTaskSize,
  deleteTaskSize,
} from "../controllers/taskSizeController.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getTaskSizes);
router.post("/", protectRoute, createTaskSize);
router.put("/:id", protectRoute, updateTaskSize);
router.delete("/:id", protectRoute, deleteTaskSize);

export default router;
