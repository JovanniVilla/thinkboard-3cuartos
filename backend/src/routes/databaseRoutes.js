import express from "express";
import { protectRoute, requireAdmin } from "../middleware/auth.js";
import { exportDatabase, importDatabase, previewImport } from "../controllers/databaseController.js";

const router = express.Router();

router.use(protectRoute, requireAdmin);

router.get("/export", exportDatabase);
router.post("/import/preview", previewImport);
router.post("/import", importDatabase);

export default router;
