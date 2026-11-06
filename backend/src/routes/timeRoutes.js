import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  getActiveTimers,
  startTimer,
  pauseTimer,
  heartbeat,
  beaconStop,
  getNoteTimeStats,
} from "../controllers/timeController.js";

const router = express.Router();

// Todas las rutas de tiempo de usuario requieren autenticación
router.use(protectRoute);

router.get("/active", getActiveTimers);
router.post("/start", startTimer);
router.post("/pause", pauseTimer);
router.post("/heartbeat", heartbeat);
router.post("/stop", beaconStop);
router.post("/beacon-stop", beaconStop);
router.get("/note/:noteId/stats", getNoteTimeStats);

export default router;
