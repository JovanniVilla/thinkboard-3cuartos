import express from "express";
import {
  getAllPriorities,
  createPriority,
  updatePriority,
  deletePriority,
} from "../controllers/priorityController.js";

const router = express.Router();

router.get("/", getAllPriorities);
router.post("/", createPriority);
router.put("/:id", updatePriority);
router.delete("/:id", deletePriority);

export default router;
