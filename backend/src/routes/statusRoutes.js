import express from "express";
import {
  getAllStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "../controllers/statusController.js";

const router = express.Router();

router.get("/", getAllStatuses);
router.post("/", createStatus);
router.put("/:id", updateStatus);
router.delete("/:id", deleteStatus);

export default router;
