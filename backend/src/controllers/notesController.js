import Note from "../models/Note.js";
import BoardConfig from "../models/BoardConfig.js";

export async function getAllNotes(_, res) {
  try {
    const notes = await Note.find().sort({ createdAt: -1 }); // -1 will sort in desc. order (newest first)
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error in getAllNotes controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getNoteById(req, res) {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found!" });
    res.json(note);
  } catch (error) {
    console.error("Error in getNoteById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createNote(req, res) {
  try {
    const { title, content, status, priority, user } = req.body;

    let boardConfig = await BoardConfig.findOne();
    let keyId = null;
    if (boardConfig && boardConfig.projectKey && boardConfig.projectKey.trim()) {
      const rawKey = boardConfig.projectKey.trim().toUpperCase();
      const prefix = rawKey.endsWith("-") ? rawKey : `${rawKey}-`;
      const counter = boardConfig.taskCounter || 1;
      keyId = `${prefix}${counter}`;

      boardConfig.taskCounter = counter + 1;
      await boardConfig.save();
    }

    const note = new Note({
      ...(keyId && { keyId }),
      title,
      content,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(user && { user }),
    });

    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error in createNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateNote(req, res) {
  try {
    const { title, content, status, priority, user, keyId } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(user !== undefined && { user }),
        ...(keyId !== undefined && { keyId }),
      },
      {
        new: true,
      }
    );

    if (!updatedNote) return res.status(404).json({ message: "Note not found" });

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error in updateNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteNote(req, res) {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) return res.status(404).json({ message: "Note not found" });
    res.status(200).json({ message: "Note deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
