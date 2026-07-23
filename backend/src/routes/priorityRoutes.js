import express from "express";
import {
  getAllPriorities,
  createPriority,
  updatePriority,
  deletePriority,
} from "../controllers/priorityController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllPriorities);
router.post("/", protectRoute, requireAdmin, createPriority);
router.put("/:id", protectRoute, requireAdmin, updatePriority);
router.delete("/:id", protectRoute, requireAdmin, deletePriority);

export default router;
