import express from "express";
import {
  getAllValues,
  createValue,
  updateValue,
  deleteValue,
} from "../controllers/valueController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllValues);
router.post("/", protectRoute, requireAdmin, createValue);
router.put("/:id", protectRoute, requireAdmin, updateValue);
router.delete("/:id", protectRoute, requireAdmin, deleteValue);

export default router;

