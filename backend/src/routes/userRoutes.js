import express from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getAllUsers);
router.post("/", protectRoute, requireAdmin, createUser);
router.put("/:id", protectRoute, requireAdmin, updateUser);
router.delete("/:id", protectRoute, requireAdmin, deleteUser);

export default router;
