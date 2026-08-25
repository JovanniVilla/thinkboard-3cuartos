import Note from "../models/Note.js";
import BoardConfig from "../models/BoardConfig.js";
import StatusConfig from "../models/StatusConfig.js";

export async function getAllNotes(req, res) {
  try {
    const filter = { archived: { $ne: true } };
    
    // Clients can only see notes assigned to their specific project
    if (req.user && req.user.role === "client") {
      filter.project = req.user.assignedProject;
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 }); // -1 will sort in desc. order (newest first)
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
    const { title, content, status, priority, user, project, labels, checklist, startDate, dueDate } = req.body;

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

    let completedAt = null;
    if (status) {
      const statusConfig = await StatusConfig.findOne({ name: status });
      if (statusConfig && statusConfig.category === "done") {
        completedAt = new Date();
      }
    }

    const note = new Note({
      ...(keyId && { keyId }),
      title,
      content,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(user && { user }),
      ...(project && { project }),
      createdBy: req.user?._id || null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      completedAt,
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
    const { title, content, status, priority, user, project, keyId, labels, checklist, activities, taskDriveLink, startDate, dueDate } = req.body;

    const currentNote = await Note.findById(req.params.id);
    if (!currentNote) return res.status(404).json({ message: "Note not found" });

    // Authorization: In this board, any authenticated user can update the note.
    // (This allows users to assign tasks, edit their comments, move tasks, etc.)

    let updatedActivities = activities !== undefined ? activities : (currentNote.activities || []);
    let completedAt = currentNote.completedAt;
    
    // Auto log status changes if status was modified and changed
    if (status !== undefined && status !== currentNote.status) {
      const statusConfig = await StatusConfig.findOne({ name: status });
      if (statusConfig && statusConfig.category === "done") {
        completedAt = new Date();
      } else if (currentNote.completedAt) {
        completedAt = null; // Revert completion if moving out of 'done'
      }

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
        ...(project !== undefined && { project: project === "" ? null : project }),
        ...(keyId !== undefined && { keyId }),
        ...(labels !== undefined && { labels }),
        ...(checklist !== undefined && { checklist }),
        ...(taskDriveLink !== undefined && { taskDriveLink }),
        ...(startDate !== undefined && { startDate }),
        ...(dueDate !== undefined && { dueDate }),
        completedAt,
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
    const { text, user, parentId, mentions = [] } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "El texto del comentario es obligatorio" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Validate parentId if provided
    if (parentId) {
      const parentComment = note.activities.find(
        (act) => (act.id === parentId || act._id.toString() === parentId) && act.type === "comment"
      );
      if (!parentComment) {
        return res.status(404).json({ message: "El comentario original no existe" });
      }
      // If the parent comment already has a parentId, it is a reply. Cannot reply to replies.
      if (parentComment.parentId) {
        return res.status(400).json({ message: "No se puede responder a una respuesta (hilo de nivel 2 no permitido)" });
      }
    }

    const actor = user || note.user || "Usuario";

    const newComment = {
      id: Date.now().toString(),
      type: "comment",
      text: text.trim(),
      user: actor,
      createdAt: new Date(),
      parentId: parentId || null,
      mentions,
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
      return res.status(403).json({ message: "No tienes permiso para archivar esta nota" });
    }

    await Note.findByIdAndUpdate(req.params.id, { archived: true });
    res.status(200).json({ message: "Note archived successfully!" });
  } catch (error) {
    console.error("Error in deleteNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
