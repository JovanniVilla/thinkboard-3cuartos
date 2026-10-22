import express from "express";
import { protectRoute, requireAdmin } from "../middleware/auth.js";
import {
  getDailyReport,
  getUserGoals,
  setUserGoals,
  updateTimeEntry,
  createManualTimeEntry,
  getAuditLogs,
  cleanZeroDurationEntries,
} from "../controllers/timeAdminController.js";

const router = express.Router();

// Todas las rutas de administración requieren autenticación y rol de administrador
router.use(protectRoute);
router.use(requireAdmin);

router.get("/reports/daily", getDailyReport);
router.get("/goals/:userId", getUserGoals);
router.put("/goals/:userId", setUserGoals);
router.put("/entries/:id", updateTimeEntry);
router.post("/entries/manual", createManualTimeEntry);
router.post("/entries/clean-zero-duration", cleanZeroDurationEntries);
router.get("/audits", getAuditLogs);

export default router;
