import express from "express";
import {
  createNote,
  deleteNote,
  getAllNotes,
  getNoteById,
  updateNote,
  addComment,
} from "../controllers/notesController.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

// All note routes require authentication
router.use(protectRoute);

router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.post("/", createNote);
router.put("/:id", updateNote);
router.post("/:id/comments", addComment);
router.delete("/:id", deleteNote);

export default router;
