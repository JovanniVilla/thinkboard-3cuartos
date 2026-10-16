import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import priorityRoutes from "./routes/priorityRoutes.js";
import boardConfigRoutes from "./routes/boardConfigRoutes.js";
import labelRoutes from "./routes/labelRoutes.js";
import databaseRoutes from "./routes/databaseRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import projectTypeRoutes from "./routes/projectTypeRoutes.js";
import projectStatusRoutes from "./routes/projectStatusRoutes.js";
import taskSizeRoutes from "./routes/taskSizeRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import subtaskRoutes from "./routes/subtaskRoutes.js";
import videoNoteRoutes from "./routes/videoNoteRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";
import { initStorageCronJob } from "./cron/storageCleanup.js";
import { UPLOADS_DIR } from "./middleware/upload.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
app.set("trust proxy", true);
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// CORS middleware (must be before any static files or API routes)
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    })
  );
}

// Static directory for uploaded visual assets (images, PDFs, and videos)
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, Authorization");
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  },
  express.static(UPLOADS_DIR, {
    setHeaders: (res) => {
      res.setHeader("Accept-Ranges", "bytes");
    },
  })
);
app.use("/uploads", (req, res) => {
  res.status(404).json({ message: "Archivo adjunto no encontrado en el almacenamiento" });
});

app.use(express.json()); // this middleware will parse JSON bodies: req.body
app.use(cookieParser());
app.use(rateLimiter);

// our simple custom middleware
// app.use((req, res, next) => {
//   console.log(`Req method is ${req.method} & Req URL is ${req.url}`);
//   next();
// });

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/priorities", priorityRoutes);
app.use("/api/board-config", boardConfigRoutes);
app.use("/api/labels", labelRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-types", projectTypeRoutes);
app.use("/api/project-statuses", projectStatusRoutes);
app.use("/api/task-sizes", taskSizeRoutes);
app.use("/api/tasks", fileRoutes); // /api/tasks/:taskId/files
app.use("/api/notes", fileRoutes); // alias /api/notes/:taskId/files
app.use("/api/files", fileRoutes); // /api/files/:fileId, /api/files/:fileId/subtasks
app.use("/api/tasks", videoNoteRoutes); // /api/tasks/:taskId/video-notes
app.use("/api/notes", videoNoteRoutes); // alias /api/notes/:taskId/video-notes
app.use("/api/video-notes", videoNoteRoutes); // /api/video-notes/:id
app.use("/api/subtasks", subtaskRoutes); // /api/subtasks
app.use("/api/storage", storageRoutes); // /api/storage (stats, files, bulk-orphans)

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

connectDB().then(() => {
  initStorageCronJob();
  app.listen(PORT, () => {
    console.log("Server started on PORT:", PORT);
  });
});
