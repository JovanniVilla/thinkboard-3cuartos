import express from "express";
import {
  getAllLabels,
  createLabel,
  updateLabel,
  deleteLabel,
} from "../controllers/labelController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllLabels);
router.post("/", protectRoute, requireAdmin, createLabel);
router.put("/:id", protectRoute, requireAdmin, updateLabel);
router.delete("/:id", protectRoute, requireAdmin, deleteLabel);

export default router;
