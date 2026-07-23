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
    const { title, content, status, priority, user, labels, checklist } = req.body;

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

    const actor = user && user !== "Sin asignar" ? user : "Sistema";

    const note = new Note({
      ...(keyId && { keyId }),
      title,
      content,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(user && { user }),
      createdBy: req.user?._id || null,
      labels: labels || [],
      checklist: checklist || [],
      activities: [
        {
          id: Date.now().toString(),
          type: "action",
          text: `${actor} agregó esta tarjeta a ${status || "Pendiente"}`,
          user: actor,
          createdAt: new Date(),
        },
      ],
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
    const { title, content, status, priority, user, keyId, labels, checklist, activities } = req.body;

    const currentNote = await Note.findById(req.params.id);
    if (!currentNote) return res.status(404).json({ message: "Note not found" });

    // Authorization: only the creator or admin can update
    const isOwner = currentNote.createdBy && req.user && currentNote.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para editar esta nota" });
    }

    let updatedActivities = activities !== undefined ? activities : (currentNote.activities || []);
    
    // Auto log status changes if status was modified and changed
    if (status !== undefined && status !== currentNote.status) {
      const actor = user || currentNote.user || "Usuario";
      updatedActivities.push({
        id: Date.now().toString(),
        type: "action",
        text: `${actor} movió esta tarjeta a ${status}`,
        user: actor,
        createdAt: new Date(),
      });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(user !== undefined && { user }),
        ...(keyId !== undefined && { keyId }),
        ...(labels !== undefined && { labels }),
        ...(checklist !== undefined && { checklist }),
        activities: updatedActivities,
      },
      {
        new: true,
      }
    );

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error in updateNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function addComment(req, res) {
  try {
    const { text, user } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "El texto del comentario es obligatorio" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const actor = user || note.user || "Usuario";

    const newComment = {
      id: Date.now().toString(),
      type: "comment",
      text: text.trim(),
      user: actor,
      createdAt: new Date(),
    };

    note.activities.push(newComment);
    const updatedNote = await note.save();

    res.status(201).json(updatedNote);
  } catch (error) {
    console.error("Error in addComment controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteNote(req, res) {
  try {
    const currentNote = await Note.findById(req.params.id);
    if (!currentNote) return res.status(404).json({ message: "Note not found" });

    // Authorization: only the creator or admin can delete
    const isOwner = currentNote.createdBy && req.user && currentNote.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta nota" });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Note deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
