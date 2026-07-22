import express from "express";
import {
  getBoardConfig,
  updateBoardConfig,
  assignExistingKeys,
} from "../controllers/boardConfigController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protectRoute, getBoardConfig);
router.put("/", protectRoute, requireAdmin, updateBoardConfig);
router.post("/assign-existing", protectRoute, requireAdmin, assignExistingKeys);

export default router;
