import express from "express";
import {
  getBoardConfig,
  updateBoardConfig,
  assignExistingKeys,
} from "../controllers/boardConfigController.js";

const router = express.Router();

router.get("/", getBoardConfig);
router.put("/", updateBoardConfig);
router.post("/assign-existing", assignExistingKeys);

export default router;
