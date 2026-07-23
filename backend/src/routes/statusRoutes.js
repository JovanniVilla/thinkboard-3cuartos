import express from "express";
import {
  getAllStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "../controllers/statusController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllStatuses);
router.post("/", protectRoute, requireAdmin, createStatus);
router.put("/:id", protectRoute, requireAdmin, updateStatus);
router.delete("/:id", protectRoute, requireAdmin, deleteStatus);

export default router;
