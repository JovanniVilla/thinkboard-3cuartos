import express from "express";
import {
  getTaskSizes,
  createTaskSize,
  updateTaskSize,
  deleteTaskSize,
} from "../controllers/taskSizeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTaskSizes);
router.post("/", protect, createTaskSize);
router.put("/:id", protect, updateTaskSize);
router.delete("/:id", protect, deleteTaskSize);

export default router;
